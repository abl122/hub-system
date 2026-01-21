import { apiFetch } from './api'

export interface EmailConfigResponse {
  success: boolean
  config?: {
    enabled: boolean
    smtp_host: string
    smtp_port: number
    username: string
    from_email: string
    from_name: string
    use_tls?: boolean
    has_password?: boolean
    updated_at?: string | null
  }
  message?: string
}

export interface EmailUpdatePayload {
  enabled?: boolean
  smtp_host?: string
  smtp_port?: number
  username?: string
  password?: string
  from_email?: string
  from_name?: string
  use_tls?: boolean
}

export interface EmailTestResponse {
  success: boolean
  message?: string
}

class EmailService {
  async getConfig(token: string): Promise<EmailConfigResponse> {
    return apiFetch('/integrations/email/config', {
      method: 'GET',
      token
    })
  }

  async updateConfig(payload: EmailUpdatePayload, token: string): Promise<EmailConfigResponse> {
    return apiFetch('/integrations/email/config', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    })
  }

  async testConnection(token: string, to?: string): Promise<EmailTestResponse> {
    return apiFetch('/integrations/email/test', {
      method: 'POST',
      token,
      body: JSON.stringify(to ? { para: to } : {})
    })
  }
}

export const emailService = new EmailService()
