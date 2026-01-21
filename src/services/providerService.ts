import { appFetch, apiFetch } from './api'

interface ProviderSettings {
  nome: string
  cnpj: string
  email: string
  telefone: string
  dominio: string
  color_primary: string
  color_secondary: string
  logo_url?: string
  assinatura: {
    plano: string
    ativa: boolean
    data_vencimento: string
  }
}

interface ProviderInfoResponse {
  success: boolean
  provider: ProviderSettings
}

interface Plan {
  _id: string
  nome: string
  descricao: string
  valor: number
  recursos: string[]
}

interface AppPlansResponse {
  success: boolean
  plans: Plan[]
}

interface FormField {
  name: string
  label: string
  type: string
  required: boolean
  placeholder: string
}

interface FormFieldsResponse {
  success: boolean
  fields: FormField[]
}

interface SystemSettings {
  logo_url: string
  favicon_url: string
  color_primary: string
  color_secondary: string
  font_family: string
  suporta_pix: boolean
  suporta_boleto: boolean
  suporta_cartao: boolean
}

interface SettingsResponse {
  success: boolean
  settings: SystemSettings
}

/**
 * Serviço de Provider/Provedor
 */
export const providerService = {
  /**
   * Obter informações do provedor/tenant
   */
  async getProviderInfo(
    tenantId: string,
    token?: string
  ): Promise<ProviderInfoResponse> {
    return appFetch('/provider-info', {
      method: 'GET',
      token,
      tenantId
    })
  },

  /**
   * Obter planos do provedor via app/portal
   */
  async getAppPlans(
    tenantId: string,
    token: string
  ): Promise<AppPlansResponse> {
    return appFetch('/plans', {
      method: 'GET',
      token,
      tenantId
    })
  },

  /**
   * Obter campos personalizados do formulário
   */
  async getFormFields(tenantId: string): Promise<FormFieldsResponse> {
    return appFetch('/form-fields', {
      method: 'GET',
      tenantId
    })
  },

  /**
   * Obter configurações do sistema
   */
  async getSettings(tenantId: string): Promise<SettingsResponse> {
    return appFetch('/settings', {
      method: 'GET',
      tenantId
    })
  }
}
