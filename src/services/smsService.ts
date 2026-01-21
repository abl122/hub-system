import { apiFetch } from './api'

export interface SmsConfigResponse {
  success: boolean
  config?: {
    enabled: boolean
    endpoint: string
    username: string
    token: string
    default_sender: string
    updated_at?: string | null
    has_password?: boolean
  }
  message?: string
}

export interface SmsUpdatePayload {
  endpoint?: string
  url?: string
  username?: string
  user?: string
  password?: string
  token?: string
  default_sender?: string
  enabled?: boolean
}

export interface SmsTestResponse {
  success: boolean
  connected?: boolean
  message?: string
  data?: any
}

class SmsService {
  async getConfig(token: string): Promise<SmsConfigResponse> {
    return apiFetch('/integrations/sms/config', {
      method: 'GET',
      token
    })
  }

  async updateConfig(payload: SmsUpdatePayload, token: string): Promise<SmsConfigResponse> {
    return apiFetch('/integrations/sms/config', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    })
  }

  async testConnection(
    token: string,
    credentials?: { endpoint?: string; url?: string; username?: string; user?: string; password?: string }
  ): Promise<SmsTestResponse> {
    return apiFetch('/integrations/sms/test', {
      method: 'POST',
      token,
      body: credentials ? JSON.stringify(credentials) : undefined
    })
  }
}

export const smsService = new SmsService()
