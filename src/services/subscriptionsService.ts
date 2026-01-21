import { apiFetch } from './api'

interface Subscription {
  _id: string
  tenant_id: string
  plan_slug: string
  plan_name: string
  valor_mensal: number
  data_inicio: string
  data_vencimento: string
  status: 'ativa' | 'suspensa' | 'cancelada' | 'inadimplente' | 'trial'
  ciclo_cobranca: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'vitalicio'
  renovacao_automatica: boolean
  is_trial: boolean
  dias_trial_restantes: number
  observacoes?: string
  criado_em: string
  atualizado_em?: string
  vencida?: boolean
  dias_ate_vencimento?: number
}

interface Payment {
  data_pagamento: string
  valor: number
  metodo: string
  status: 'pendente' | 'confirmado' | 'cancelado' | 'estornado'
  referencia?: string
  observacoes?: string
}

interface ListSubscriptionsResponse {
  success: boolean
  subscriptions: Subscription[]
  total: number
}

interface GetSubscriptionResponse {
  success: boolean
  subscription: Subscription
}

interface CreateSubscriptionRequest {
  tenant_id: string
  plan_slug: string
  valor_mensal?: number
  data_inicio?: string
  ciclo_cobranca?: string
  status?: string
  observacoes?: string
}

interface CreateSubscriptionResponse {
  success: boolean
  message: string
  subscription: Subscription
}

interface UpdateSubscriptionResponse {
  success: boolean
  message: string
  subscription: Subscription
}

interface ChangePlanRequest {
  new_plan_slug: string
  imediato?: boolean
}

interface RevenueMetrics {
  total_subscriptions: number
  mrr: number
  avg_value: number
  active_count: number
  cancelled_count: number
  suspended_count: number
  overdue_count: number
}

interface MetricsResponse {
  success: boolean
  metrics: RevenueMetrics
}

interface HistoryResponse {
  success: boolean
  history: Array<{
    plan_slug: string
    plan_name: string
    data_inicio: string
    data_vencimento: string
    status: string
    criado_em: string
  }>
  total: number
}

/**
 * Serviço de Assinaturas
 */
export const subscriptionsService = {
  /**
   * Listar assinaturas de um tenant
   */
  async listByTenant(
    tenantId: string,
    token: string,
    status?: string
  ): Promise<ListSubscriptionsResponse> {
    const query = new URLSearchParams()
    query.append('tenant_id', tenantId)
    if (status) query.append('status', status)

    return apiFetch(`/admin/subscriptions?${query.toString()}`, {
      method: 'GET',
      token
    })
  },

  /**
   * Buscar assinatura ativa de um tenant
   */
  async getActive(tenantId: string, token: string): Promise<GetSubscriptionResponse> {
    return apiFetch(`/admin/subscriptions/active/${tenantId}`, {
      method: 'GET',
      token
    })
  },

  /**
   * Criar nova assinatura
   */
  async create(
    data: CreateSubscriptionRequest,
    token: string
  ): Promise<CreateSubscriptionResponse> {
    return apiFetch('/admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })
  },

  /**
   * Atualizar assinatura
   */
  async update(
    subscriptionId: string,
    data: Partial<Subscription>,
    token: string
  ): Promise<UpdateSubscriptionResponse> {
    return apiFetch(`/admin/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token
    })
  },

  /**
   * Mudar status da assinatura
   */
  async changeStatus(
    subscriptionId: string,
    status: string,
    motivo: string,
    token: string
  ): Promise<UpdateSubscriptionResponse> {
    return apiFetch(`/admin/subscriptions/${subscriptionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, motivo }),
      token
    })
  },

  /**
   * Renovar assinatura
   */
  async renovar(
    subscriptionId: string,
    meses: number,
    token: string
  ): Promise<UpdateSubscriptionResponse> {
    return apiFetch(`/admin/subscriptions/${subscriptionId}/renovar`, {
      method: 'POST',
      body: JSON.stringify({ meses }),
      token
    })
  },

  /**
   * Registrar pagamento
   */
  async registrarPagamento(
    subscriptionId: string,
    pagamento: Payment,
    token: string
  ): Promise<UpdateSubscriptionResponse> {
    return apiFetch(`/admin/subscriptions/${subscriptionId}/pagamentos`, {
      method: 'POST',
      body: JSON.stringify(pagamento),
      token
    })
  },

  /**
   * Mudar plano
   */
  async changePlan(
    tenantId: string,
    data: ChangePlanRequest,
    token: string
  ): Promise<CreateSubscriptionResponse> {
    return apiFetch(`/admin/subscriptions/${tenantId}/change-plan`, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })
  },

  /**
   * Histórico de planos
   */
  async getHistory(tenantId: string, token: string): Promise<HistoryResponse> {
    return apiFetch(`/admin/subscriptions/history/${tenantId}`, {
      method: 'GET',
      token
    })
  },

  /**
   * Métricas de receita
   */
  async getMetrics(
    token: string,
    filters?: {
      status?: string
      start_date?: string
      end_date?: string
    }
  ): Promise<MetricsResponse> {
    const query = new URLSearchParams()
    if (filters?.status) query.append('status', filters.status)
    if (filters?.start_date) query.append('start_date', filters.start_date)
    if (filters?.end_date) query.append('end_date', filters.end_date)

    return apiFetch(`/admin/subscriptions/metrics?${query.toString()}`, {
      method: 'GET',
      token
    })
  }
}

export type {
  Subscription,
  Payment,
  RevenueMetrics,
  CreateSubscriptionRequest,
  ChangePlanRequest
}
