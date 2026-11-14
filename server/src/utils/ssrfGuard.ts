import dns from 'node:dns/promises';
import https from 'node:https';
import http from 'node:http';
import net from 'node:net';

export class SSRFSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFSecurityError';
  }
}

/**
 * Checks if an IPv4 or IPv6 address belongs to private, loopback, or metadata networks.
 */
export function isPrivateOrRestrictedIp(ip: string): boolean {
  // IPv4 Checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [b0, b1] = parts;

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true;
    // 10.0.0.0/8 (Private)
    if (b0 === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true;
    // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (b0 === 169 && b1 === 254) return true;
    // 172.16.0.0/12 (Private)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (b0 === 192 && b1 === 168) return true;
    // 224.0.0.0/4 (Multicast)
    if (b0 >= 224 && b0 <= 239) return true;
    // 240.0.0.0/4 & 255.255.255.255 (Reserved & Broadcast)
    if (b0 >= 240) return true;

    return false;
  }

  // IPv6 Checks
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // ::1 (Loopback)
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
    // :: (Unspecified)
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
    // Unique Local Addresses (fc00::/7)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    // Link-local Unicast (fe80::/10)
    if (normalized.startsWith('fe80:')) return true;
    // Multicast (ff00::/8)
    if (normalized.startsWith('ff')) return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
    if (normalized.includes('::ffff:')) {
      const ipv4Part = normalized.split('::ffff:')[1];
      if (ipv4Part && net.isIPv4(ipv4Part)) {
        return isPrivateOrRestrictedIp(ipv4Part);
      }
    }
    return false;
  }

  return true; // Reject unrecognized IP format
}

export interface SafeHttpResponse {
  statusCode: number;
  body: string;
  durationMs: number;
}

/**
 * SSRF-Safe HTTP client
 */
export async function safeHttpRequest(
  targetUrl: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    maxRedirects?: number;
    timeoutMs?: number;
  } = {}
): Promise<SafeHttpResponse> {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const maxRedirects = options.maxRedirects ?? 2;
  const timeoutMs = options.timeoutMs ?? 10000;

  let currentUrl = targetUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const parsed = new URL(currentUrl);

    // Protocol check
    const isHttps = parsed.protocol === 'https:';
    if (!isHttps && !isDev) {
      throw new SSRFSecurityError('Only HTTPS webhooks are permitted in production');
    }

    // Port check
    const port = parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80);
    const allowedPorts = isDev ? [80, 443, 8443, 3000, 4000, 5000, 8080] : [443, 8443];
    if (!allowedPorts.includes(port)) {
      throw new SSRFSecurityError(`Port ${port} is not allowed for outbound webhooks`);
    }

    // 1. Resolve DNS explicitly
    let resolvedIps: string[];
    if (net.isIP(parsed.hostname)) {
      resolvedIps = [parsed.hostname];
    } else {
      const addresses = await dns.lookup(parsed.hostname, { all: true });
      resolvedIps = addresses.map((a) => a.address);
    }

    if (resolvedIps.length === 0) {
      throw new SSRFSecurityError(`Unable to resolve hostname: ${parsed.hostname}`);
    }

    // 2. Validate all resolved IPs against SSRF denylist
    for (const ip of resolvedIps) {
      if (isPrivateOrRestrictedIp(ip) && !isDev) {
        throw new SSRFSecurityError(
          `SSRF Security Block: Destination IP ${ip} resolves to a private, loopback, or cloud metadata address.`
        );
      }
    }

    const targetIp = resolvedIps[0];
    const startTime = Date.now();

    // 3. Dispatch HTTP request with explicit Host header and direct IP target
    const requestOptions: https.RequestOptions = {
      method: options.method || 'POST',
      host: targetIp,
      port,
      path: `${parsed.pathname}${parsed.search}`,
      headers: {
        ...(options.headers || {}),
        Host: parsed.host,
      },
      timeout: timeoutMs,
      rejectUnauthorized: !isDev,
      servername: parsed.hostname,
    };

    const client = isHttps ? https : http;

    const res = await new Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }>(
      (resolve, reject) => {
        const req = client.request(requestOptions, (response) => {
          let chunks: Buffer[] = [];
          let bytesRead = 0;
          const maxBytes = 64 * 1024; // 64 KB limit

          response.on('data', (chunk: Buffer) => {
            bytesRead += chunk.length;
            if (bytesRead > maxBytes) {
              req.destroy();
              reject(new SSRFSecurityError('Response body exceeded maximum limit of 64 KB'));
              return;
            }
            chunks.push(chunk);
          });

          response.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            resolve({
              statusCode: response.statusCode || 0,
              headers: response.headers,
              body,
            });
          });
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new SSRFSecurityError('Webhook request timed out after 10 seconds'));
        });

        req.on('error', (err) => reject(err));

        if (options.body) {
          req.write(options.body);
        }
        req.end();
      }
    );

    const durationMs = Date.now() - startTime;

    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      redirectsCount++;
      if (redirectsCount > maxRedirects) {
        throw new SSRFSecurityError(`Maximum redirect hops (${maxRedirects}) exceeded`);
      }
      currentUrl = new URL(res.headers.location, currentUrl).toString();
      continue;
    }

    return {
      statusCode: res.statusCode,
      body: res.body.slice(0, 1000),
      durationMs,
    };
  }

  throw new SSRFSecurityError('Redirect chain aborted');
}
