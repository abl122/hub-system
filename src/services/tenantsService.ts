import { apiFetch } from './api'

interface ProviderInfo {
  nome: string
  cnpj: string
  email: string
  telefone: string
  dominio: string
}

interface SubscriptionInfo {
  plano: string
  ativa: boolean
  data_vencimento: string
}

interface AgentInfo {
  url: string
  ativo: boolean
  token: string
  ultima_conexao: string
}

interface Plan {
  _id: string
  nome: string
  slug: string
  valor: number
  ativo: boolean
  ordem: number
  criado_em: string
  limite_clientes?: number | null
  recursos?: string[]
  dias_trial?: number
}

interface Tenant {
  _id: string
  provedor: ProviderInfo
  assinatura: SubscriptionInfo
  agente: AgentInfo
  plans: Plan[]
  color_primary: string
  color_secondary: string
  criado_em?: string
  atualizado_em?: string
}

interface ListTenantsResponse {
  success: boolean
  tenants: Tenant[]
  total: number
  pages: number
  current_page: number
}

interface GetTenantResponse {
  success: boolean
  tenant: Tenant
}

interface CreateTenantRequest {
  provedor: {
    nome: string
    cnpj: string
    email: string
    telefone: string
    dominio: string
  }
  assinatura: {
    plano: string
    ativa: boolean
  }
  agente: {
    url: string
    token: string
  }
  color_primary: string
  color_secondary: string
}

interface CreateTenantResponse {
  success: boolean
  message: string
  tenant: Partial<Tenant>
}

interface UpdateTenantRequest {
  provedor?: Partial<ProviderInfo>
  assinatura?: Partial<SubscriptionInfo>
  agente?: Partial<AgentInfo>
  color_primary?: string
  color_secondary?: string
}

interface UpdateTenantResponse {
  success: boolean
  message: string
  tenant: Partial<Tenant>
}

interface DeleteTenantResponse {
  success: boolean
  message: string
}

/**
 * Serviço de Tenants
 */
export const tenantsService = {
  /**
   * Listar todos os tenants com paginação e filtros
   */
  async listTenants(
    token: string,
    page: number = 1,
    limit: number = 10,
    filters?: {
      ativo?: boolean
      agenteAtivo?: boolean
      nome?: string
    }
  ): Promise<ListTenantsResponse> {
    const query = new URLSearchParams()
    query.append('page', page.toString())
    query.append('limit', limit.toString())

    if (filters?.ativo !== undefined) {
      query.append('ativo', filters.ativo.toString())
    }
    if (filters?.agenteAtivo !== undefined) {
      query.append('agenteAtivo', filters.agenteAtivo.toString())
    }
    if (filters?.nome) {
      query.append('nome', filters.nome)
    }

    return apiFetch(`/tenants?${query.toString()}`, {
      method: 'GET',
      token
    })
  },

  /**
   * Buscar tenant específico
   */
  async getTenant(tenantId: string, token: string): Promise<GetTenantResponse> {
    return apiFetch(`/tenants/${tenantId}`, {
      method: 'GET',
      token
    })
  },

  /**
   * Criar novo tenant
   */
  async createTenant(
    data: CreateTenantRequest,
    token: string
  ): Promise<CreateTenantResponse> {
    return apiFetch('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })
  },

  /**
   * Atualizar tenant
   */
  async updateTenant(
    tenantId: string,
    data: UpdateTenantRequest,
    token: string
  ): Promise<UpdateTenantResponse> {
    return apiFetch(`/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token
    })
  },

  /**
   * Resetar senha do portal e retornar a nova senha em texto claro
   */
  async resetPortalPassword(
    tenantId: string,
    data: { newPassword?: string; generate?: boolean },
    token: string
  ): Promise<{ success: boolean; password?: string; message?: string }> {
    return apiFetch(`/tenants/${tenantId}/portal/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })
  },

  /**
   * Obter usuário do portal (login, nome, ativo)
   */
  async getPortalUser(
    tenantId: string,
    token: string
  ): Promise<{ success: boolean; user: { login: string; nome: string; ativo: boolean } | null }> {
    return apiFetch(`/tenants/${tenantId}/portal/user`, {
      method: 'GET',
      token
    })
  },

  /**
   * Deletar tenant
   */
  async deleteTenant(tenantId: string, token: string): Promise<DeleteTenantResponse> {
    return apiFetch(`/tenants/${tenantId}`, {
      method: 'DELETE',
      token
    })
  }
}
