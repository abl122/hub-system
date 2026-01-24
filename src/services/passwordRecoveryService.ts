/**
 * API Service para Recuperação de Senha
 */

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api'

async function request(method: string, endpoint: string, data?: any, query?: Record<string, string>) {
  const qs = query
    ? '?' + new URLSearchParams(query).toString()
    : ''

  const response = await fetch(`${apiBaseUrl}${endpoint}${qs}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: method !== 'GET' ? JSON.stringify(data || {}) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.json()
    const error = new Error(errorData.message || 'Erro na requisição')
    ;(error as any).response = { data: errorData, status: response.status }
    throw error
  }

  return response.json()
}

export const passwordRecoveryService = {
  /**
   * Obter contatos mascarados do cadastro
   */
  async getContacts(identifier: string) {
    const response = await request('GET', '/auth/password-recovery/contacts', undefined, {
      identifier,
    })
    return {
      data: response.data
    }
  },

  /**
   * Solicitar código de recuperação via SMS
   */
  requestSmsRecovery(cnpjOrUsername: string) {
    return request('POST', '/auth/password-recovery/request-sms', {
      cnpjOrUsername,
    })
  },

  /**
   * Solicitar código de recuperação via WhatsApp
   */
  requestWhatsappRecovery(cnpjOrUsername: string) {
    return request('POST', '/auth/password-recovery/request-whatsapp', {
      cnpjOrUsername,
    })
  },

  /**
   * Solicitar código de recuperação via Email
   */
  requestEmailRecovery(cnpjOrUsername: string) {
    return request('POST', '/auth/password-recovery/request-email', {
      cnpjOrUsername,
    })
  },

  /**
   * Verificar código e resetar senha
   */
  verifyCodeAndReset(cnpjOrUsername: string, code: string, newPassword: string) {
    return request('POST', '/auth/password-recovery/verify-code', {
      cnpjOrUsername,
      code,
      newPassword
    })
  }
}

export default passwordRecoveryService
