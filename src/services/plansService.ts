import { apiFetch, publicFetch } from './api'

interface Plan {
  _id: string
  nome: string
  slug: string
  descricao: string
  valor_mensal: number
  periodo: string
  recorrente: boolean
  limite_clientes: number | null
  recursos: string[]
  destaque: boolean
  cor: string
  dias_trial: number
  ativo: boolean
  ordem: number
  criado_em: string
  atualizado_em?: string
}

interface ListPlansResponse {
  success: boolean
  plans: Plan[]
  total: number
}

interface GetPlanResponse {
  success: boolean
  plan: Plan
}

interface CreatePlanRequest {
  nome: string
  slug: string
  descricao: string
  valor_mensal: number
  periodo: string
  recorrente: boolean
  limite_clientes: number | null
  recursos: string[]
  destaque: boolean
  cor: string
  dias_trial: number
  ativo: boolean
}

interface CreatePlanResponse {
  success: boolean
  message: string
  plan: Plan
}

interface UpdatePlanRequest {
  nome?: string
  slug?: string
  descricao?: string
  valor?: number
  periodo?: string
  recorrente?: boolean
  limite_clientes?: number | null
  recursos?: string[]
  destaque?: boolean
  cor?: string
  dias_trial?: number
  ativo?: boolean
}

interface UpdatePlanResponse {
  success: boolean
  message: string
  plan: Plan
}

interface DeletePlanResponse {
  success: boolean
  message: string
}

interface TogglePlanResponse {
  success: boolean
  message: string
  plan: Partial<Plan>
}

interface PublicPlansResponse {
  success: boolean
  plans: Array<Omit<Plan, 'ativo' | 'ordem' | 'criado_em' | 'atualizado_em'>>
  total: number
  tenant_name: string
  tenant_color_primary: string
  tenant_color_secondary: string
}

/**
 * Serviço de Planos
 */
export const plansService = {
  /**
   * Listar TODOS os planos de TODOS os tenants (Admin)
   */
  async listAllPlans(token: string): Promise<ListPlansResponse> {
    return apiFetch('/admin/plans', {
      method: 'GET',
      token
    })
  },

  /**
   * Listar planos (autenticado)
   */
  async listPlans(
    token: string,
    tenantId?: string,
    activeOnly: boolean = false
  ): Promise<ListPlansResponse> {
    const query = new URLSearchParams()
    if (activeOnly) query.append('active_only', 'true')

    return apiFetch(`/plans?${query.toString()}`, {
      method: 'GET',
      token,
      tenantId
    })
  },

  /**
   * Listar planos de um tenant específico (para admin)
   */
  async listTenantPlans(
    tenantId: string,
    token: string,
    activeOnly: boolean = false
  ): Promise<ListPlansResponse> {
    const query = new URLSearchParams()
    if (activeOnly) query.append('active_only', 'true')

    return apiFetch(`/admin/tenants/${tenantId}/plans?${query.toString()}`, {
      method: 'GET',
      token
    })
  },

  /**
   * Obter plano específico
   */
  async getPlan(
    planId: string,
    token: string,
    tenantId?: string
  ): Promise<GetPlanResponse> {
    return apiFetch(`/plans/${planId}`, {
      method: 'GET',
      token,
      tenantId
    })
  },

  /**
   * Criar novo plano
   */
  async createPlan(
    data: CreatePlanRequest,
    token: string,
    tenantId: string
  ): Promise<CreatePlanResponse> {
    return apiFetch('/plans', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      tenantId
    })
  },

  /**
   * Atualizar plano
   */
  async updatePlan(
    planId: string,
    data: UpdatePlanRequest,
    token: string,
    tenantId: string
  ): Promise<UpdatePlanResponse> {
    return apiFetch(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
      tenantId
    })
  },

  /**
   * Deletar plano
   */
  async deletePlan(
    planId: string,
    token: string,
    tenantId: string
  ): Promise<DeletePlanResponse> {
    return apiFetch(`/plans/${planId}`, {
      method: 'DELETE',
      token,
      tenantId
    })
  },

  /**
   * Ativar/Desativar plano
   */
  async togglePlan(
    planId: string,
    token: string,
    tenantId: string
  ): Promise<TogglePlanResponse> {
    return apiFetch(`/plans/${planId}/toggle`, {
      method: 'PATCH',
      token,
      tenantId
    })
  },

  /**
   * Listar planos públicos (SEM autenticação)
   * Se dominio não for passado, retorna todos os planos ativos
   */
  async getPublicPlans(dominio?: string): Promise<PublicPlansResponse> {
    const url = dominio 
      ? `/api/public/plans?dominio=${encodeURIComponent(dominio)}`
      : '/api/public/plans'
    
    return publicFetch(url, {
      method: 'GET'
    })
  }
}
