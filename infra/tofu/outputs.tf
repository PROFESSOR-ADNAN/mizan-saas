output "server_ipv4" {
  description = "Public IPv4 address of Mizan VPS"
  value       = hcloud_server.mizan_primary.ipv4_address
}

output "server_ipv6" {
  description = "Public IPv6 network of Mizan VPS"
  value       = hcloud_server.mizan_primary.ipv6_network
}

output "server_status" {
  description = "Deployment status of primary VPS"
  value       = hcloud_server.mizan_primary.status
}
