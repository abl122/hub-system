/**
 * Formata uma data ISO para formato brasileiro
 * @param date - Data em formato ISO ou Date object
 * @param includeTime - Se deve incluir hora
 * @returns Data formatada (dd/mm/yyyy ou dd/mm/yyyy hh:mm)
 */
export function formatDate(date: string | Date | null | undefined, includeTime = false): string {
  if (!date) return '-'

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(d.getTime())) return '-'

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    const dateStr = `${day}/${month}/${year}`

    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${dateStr} ${hours}:${minutes}`
    }

    return dateStr
  } catch {
    return '-'
  }
}

/**
 * Formata uma data para o formato aceito por input[type="date"]
 * @param date - Data em formato ISO ou Date object
 * @returns Data no formato yyyy-mm-dd
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(d.getTime())) return ''

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

/**
 * Calcula dias entre duas datas
 */
export function daysBetween(date1: string | Date, date2: string | Date = new Date()): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  
  const diff = d1.getTime() - d2.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Formata dias até vencimento
 */
export function formatDaysUntilExpiry(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  const days = daysBetween(date)
  
  if (days < 0) return `Vencida há ${Math.abs(days)} dia(s)`
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  return `${days} dia(s)`
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Formata status de assinatura
 */
export function formatSubscriptionStatus(status: string): { text: string; color: string } {
  const statusMap: Record<string, { text: string; color: string }> = {
    ativa: { text: 'Ativa', color: '#22c55e' },
    trial: { text: 'Trial', color: '#3b82f6' },
    suspensa: { text: 'Suspensa', color: '#f59e0b' },
    cancelada: { text: 'Cancelada', color: '#ef4444' },
    inadimplente: { text: 'Inadimplente', color: '#dc2626' }
  }

  return statusMap[status] || { text: status, color: '#6b7280' }
}
