import { apiFetch } from './api'

interface ZApiConfig {
  instanceId: string
  instanceToken: string
  securityToken?: string
}

interface ZApiTestResponse {
  success: boolean
  message: string
  connected?: boolean
  status?: string
}

class ZApiService {
  /**
   * Obter configuração de Z-API
   */
  async getConfig(token: string) {
    try {
      const response = await apiFetch('/integrations/zapi/config', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Atualizar configuração de Z-API
   */
  async updateConfig(config: ZApiConfig, token: string) {
    try {
      const response = await apiFetch('/integrations/zapi/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })

      return response
    } catch (error) {

      throw error
    }
  }

  /**
   * Testar conexão com Z-API
   */
  async testConnection(token: string, credentials?: { instanceId: string; instanceToken: string }): Promise<ZApiTestResponse> {
    try {
      const response = await apiFetch('/integrations/zapi/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: credentials ? JSON.stringify(credentials) : undefined
      })

      return response
    } catch (error) {
      return { success: false, message: 'Erro ao testar conexão' }
    }
  }
}

export const zapiService = new ZApiService()
