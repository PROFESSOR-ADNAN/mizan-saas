variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
  default     = "dummy-token-replace-in-env"
}

variable "server_type" {
  description = "VPS Instance Type (CPX31: 4 vCPU, 8 GB RAM, 160 GB SSD ~ $15/mo)"
  type        = string
  default     = "cpx31"
}

variable "location" {
  description = "Datacenter Location"
  type        = string
  default     = "fsn1"
}

variable "domain_name" {
  description = "Mizan SaaS primary domain"
  type        = string
  default     = "mizan.example.com"
}

variable "ssh_public_key" {
  description = "SSH public key for server administration"
  type        = string
  default     = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPlatformAdminDevKey mizan-admin"
}
