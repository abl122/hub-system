import { publicFetch } from './api'

export interface CheckoutData {
  tenant_id: string
  plan_slug: string
  ambiente: 'homologacao' | 'producao'
}

export interface CheckoutResponse {
  success: boolean
  message?: string
  pix_code?: string
  qr_code?: string
  qr_code_image?: string
  payment_id?: string
  expires_in?: number
}

export interface ConfirmPaymentData {
  payment_id: string
  tenant_id: string
}

export interface ConfirmPaymentResponse {
  success: boolean
  message?: string
}

export const paymentService = {
  /**
   * Inicia checkout e gera cobrança PIX via EFI
   */
  async initiateCheckout(data: CheckoutData): Promise<CheckoutResponse> {
    return publicFetch('/api/checkout/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Simula confirmação de pagamento (para MVP sem webhook EFI)
   */
  async confirmPayment(data: ConfirmPaymentData): Promise<ConfirmPaymentResponse> {
    return publicFetch('/api/checkout/confirm', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}
