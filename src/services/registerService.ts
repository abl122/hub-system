import { publicFetch } from './api'

export interface RegisterData {
  // Dados do Provedor/Tenant
  nome: string
  razao_social?: string
  cnpj: string
  dominio?: string
  email: string
  telefone: string
  // Dados do Administrador
  admin_nome: string
  admin_email: string
  admin_telefone?: string
  senha: string
  plan_slug: string
}

export interface RegisterResponse {
  success: boolean
  message?: string
  user_id?: string
  tenant_id?: string
  subscription_id?: string
}

export const registerService = {
  /**
   * Registra novo usuário/tenant no sistema
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    // Usar publicFetch que já está configurado corretamente
    return publicFetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}
