import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateOrRestrictedIp, safeHttpRequest, SSRFSecurityError } from '../../worker/src/utils/ssrfGuard.js';

describe('SSRF Guard & Network Defense Test Suite', () => {
  it('Blocks IPv4 loopback addresses (127.0.0.0/8)', () => {
    assert.equal(isPrivateOrRestrictedIp('127.0.0.1'), true);
    assert.equal(isPrivateOrRestrictedIp('127.0.0.254'), true);
    assert.equal(isPrivateOrRestrictedIp('127.10.20.30'), true);
  });

  it('Blocks AWS / GCP / DigitalOcean cloud metadata IP (169.254.169.254)', () => {
    assert.equal(isPrivateOrRestrictedIp('169.254.169.254'), true);
    assert.equal(isPrivateOrRestrictedIp('169.254.0.1'), true);
  });

  it('Blocks RFC 1918 private IPv4 subnets', () => {
    // 10.0.0.0/8
    assert.equal(isPrivateOrRestrictedIp('10.0.0.1'), true);
    assert.equal(isPrivateOrRestrictedIp('10.255.255.255'), true);

    // 172.16.0.0/12
    assert.equal(isPrivateOrRestrictedIp('172.16.0.1'), true);
    assert.equal(isPrivateOrRestrictedIp('172.31.255.255'), true);
    assert.equal(isPrivateOrRestrictedIp('172.32.0.1'), false); // Public

    // 192.168.0.0/16
    assert.equal(isPrivateOrRestrictedIp('192.168.1.1'), true);
    assert.equal(isPrivateOrRestrictedIp('192.168.100.200'), true);
  });

  it('Blocks IPv6 loopback, unspecified, and local unicast addresses', () => {
    assert.equal(isPrivateOrRestrictedIp('::1'), true);
    assert.equal(isPrivateOrRestrictedIp('::'), true);
    assert.equal(isPrivateOrRestrictedIp('fc00::1'), true);
    assert.equal(isPrivateOrRestrictedIp('fd12:3456:789a::1'), true);
    assert.equal(isPrivateOrRestrictedIp('fe80::1'), true);
    assert.equal(isPrivateOrRestrictedIp('ff02::1'), true);
  });

  it('Blocks IPv4-mapped IPv6 loopback addresses', () => {
    assert.equal(isPrivateOrRestrictedIp('::ffff:127.0.0.1'), true);
    assert.equal(isPrivateOrRestrictedIp('::ffff:169.254.169.254'), true);
  });

  it('Permits legitimate public IPv4 internet addresses', () => {
    assert.equal(isPrivateOrRestrictedIp('8.8.8.8'), false);
    assert.equal(isPrivateOrRestrictedIp('1.1.1.1'), false);
    assert.equal(isPrivateOrRestrictedIp('93.184.216.34'), false);
    assert.equal(isPrivateOrRestrictedIp('203.0.113.195'), false);
  });

  it('safeHttpRequest rejects private targets with SSRFSecurityError', async () => {
    // Temporarily set NODE_ENV to production to test strict enforcement
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      await assert.rejects(
        async () => {
          await safeHttpRequest('https://169.254.169.254/latest/meta-data/');
        },
        (err: any) => {
          return err instanceof SSRFSecurityError;
        }
      );

      await assert.rejects(
        async () => {
          await safeHttpRequest('https://127.0.0.1:443/secret');
        },
        (err: any) => {
          return err instanceof SSRFSecurityError;
        }
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
