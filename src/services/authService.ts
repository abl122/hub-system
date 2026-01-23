import { apiFetch } from './api'

interface LoginAdminRequest {
  username: string
  password: string
}

interface LoginPortalRequest {
  cnpj: string
  password: string
}

interface LoginAdminResponse {
  success: boolean
  token: string
  user: {
    id: string
    email: string
    role: 'admin'
  }
}

interface LoginPortalResponse {
  success: boolean
  token: string
  tenant: {
    id: string
    nome: string
    cnpj: string
    plano: string
    agente_ativo?: boolean
    agente?: {
      token: string | null
      url: string | null
      ativo: boolean
    }
  }
}

interface LogoutResponse {
  success: boolean
  message: string
}

interface VerifyTokenResponse {
  success: boolean
  valid: boolean
  expires_in: number
}

interface GetMeResponse {
  success: boolean
  user: {
    id: string
    email: string
    tenant_id: string
    role: string
  }
}

/**
 * Normalizar CNPJ (remove . / e -)
 */
function normalizeCNPJ(cnpj: string): string {
  return cnpj.replace(/[.\/-]/g, '')
}

/**
 * Formatar CNPJ (adiciona . / e -)
 */
function formatCNPJ(cnpj: string): string {
  const cleaned = normalizeCNPJ(cnpj)
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Serviço de Autenticação
 */
export const authService = {
  /**
   * Login como Admin (usuário/senha)
   */
  async loginAdmin(
    username: string,
    password: string
  ): Promise<LoginAdminResponse> {
    return apiFetch('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },

  /**
   * Login como Portal (CNPJ/senha)
   */
  async loginPortal(
    cnpj: string,
    password: string
  ): Promise<LoginPortalResponse> {
    const normalizedCnpj = normalizeCNPJ(cnpj)
    return apiFetch('/auth/portal/login', {
      method: 'POST',
      body: JSON.stringify({ cnpj: normalizedCnpj, password })
    })
  },

  /**
   * Logout
   */
  async logout(token: string): Promise<LogoutResponse> {
    return apiFetch('/auth/logout', {
      method: 'POST',
      token
    })
  },

  /**
   * Verificar se token é válido
   */
  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    return apiFetch('/auth/verify', {
      method: 'GET',
      token
    })
  },

  /**
   * Obter dados do usuário logado
   */
  async getMe(token: string): Promise<GetMeResponse> {
    return apiFetch('/me', {
      method: 'GET',
      token
    })
  }
}
