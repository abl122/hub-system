import { apiFetch } from './api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'

export interface EfiConfigResponse {
  success: boolean
  config?: {
    sandbox: boolean
    enabled: boolean
    // Suporte legado (estrutura plana)
    client_id?: string
    client_secret?: string
    pix_key?: string
    environment?: 'sandbox' | 'production'
    homologacao: {
      client_id: string
      client_secret?: string
      pix_key?: string
      has_certificate?: boolean
      certificate_filename?: string | null
    }
    producao: {
      client_id: string
      client_secret?: string
      pix_key?: string
      has_certificate?: boolean
      certificate_filename?: string | null
    }
    updated_at?: string | null
  }
  message?: string
}

export interface EfiUpdatePayload {
  sandbox: boolean
  enabled?: boolean
  homologacao_client_id?: string
  homologacao_client_secret?: string
  homologacao_pix_key?: string
  producao_client_id?: string
  producao_client_secret?: string
  producao_pix_key?: string
}

export interface EfiTestResponse {
  success: boolean
  connected?: boolean
  message?: string
  data?: any
}

export interface EfiUploadResponse {
  success: boolean
  message?: string
  certificate?: {
    filename: string
    environment: 'homologacao' | 'producao'
    uploaded_at?: string
  }
}

class EfiService {
  async getConfig(token: string): Promise<EfiConfigResponse> {
    return apiFetch('/integrations/efi/config', {
      method: 'GET',
      token
    })
  }

  async updateConfig(payload: EfiUpdatePayload, token: string): Promise<EfiConfigResponse> {
    return apiFetch('/integrations/efi/config', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    })
  }

  async testConnection(token: string): Promise<EfiTestResponse> {
    return apiFetch('/integrations/efi/test', {
      method: 'POST',
      token
    })
  }

  async uploadCertificate(
    token: string,
    environment: 'homologacao' | 'producao',
    file: File
  ): Promise<EfiUploadResponse> {
    const formData = new FormData()
    formData.append('certificate', file)
    formData.append('environment', environment)

    const response = await fetch(`${API_BASE_URL}/integrations/efi/upload-certificate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao enviar certificado')
    }
    return data
  }
}

export const efiService = new EfiService()
