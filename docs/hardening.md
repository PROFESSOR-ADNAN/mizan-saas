# Mizan Production Hardening & Network Security

## 1. Operating System Hardening
- **Base OS**: Ubuntu 24.04 LTS x86_64
- **Kernel sysctl hardening** (`/etc/sysctl.d/99-mizan.conf`):
  - Disable IP forwarding: `net.ipv4.ip_forward = 0`
  - Disable ICMP redirect acceptance: `net.ipv4.conf.all.accept_redirects = 0`
  - Enable TCP SYN cookies to mitigate SYN flood attacks: `net.ipv4.tcp_syncookies = 1`
  - Disable source routing: `net.ipv4.conf.all.accept_source_route = 0`
  - Enable reverse path filtering: `net.ipv4.conf.all.rp_filter = 1`
  - Restrict dmesg to root: `kernel.dmesg_restrict = 1`
  - ASLR full randomization: `kernel.randomize_va_space = 2`

## 2. Firewall & SSH Security
- **UFW / nftables Policy**: Default DENY incoming, ALLOW outgoing.
  - Port 80 (HTTP) -> Only allowed from Cloudflare IP ranges.
  - Port 443 (HTTPS) -> Only allowed from Cloudflare IP ranges.
  - Port 22 (SSH) -> Disabled on public internet; accessible solely via VPN (Tailscale/WireGuard interface).
- **SSH Hardening**:
  - `PermitRootLogin no`
  - `PasswordAuthentication no`
  - `PubkeyAuthentication yes`
  - `MaxAuthTries 3`
- **Fail2ban**: Installed to ban IPs with repeated abnormal connection patterns.
- **Unattended-Upgrades**: Automated nightly security patching enabled.

## 3. Container & Docker Security
- **Rootless Containers**: All Node.js services run under unprivileged `node` user (`UID 1000`).
- **Read-Only Root Filesystem**: Containers run with `--read-only`, mounting temporary write buffers only on designated `/tmp` scratch tmpfs.
- **Dropped Capabilities**: `cap_drop: [ALL]`, with only minimal network privileges retained.
- **Security Options**: `no-new-privileges:true` on all containers.
- **Internal Network Isolation**:
  - `mizan_internal_net`: MongoDB, Redis, API, and Worker communicate privately. No public host port bindings.
  - `mizan_webhook_net`: Isolated egress network for Webhook Worker. Physically disconnected from MongoDB and Redis.

## 4. Host Audit & Lynis Benchmark
- Automated Lynis hardening script (`scripts/lynis-check.sh`) verifies compliance.
- Target Lynis hardening index >= 80/100.
