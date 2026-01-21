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
    // Fazer fetch sem token (público)
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Erro ${response.status}`)
    }

    return response.json()
  }
}
