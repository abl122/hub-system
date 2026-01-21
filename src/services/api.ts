/**
 * Serviço base de API
 * Configuração centralizada para todas as chamadas à API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
const APP_BASE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3333/app'
const PUBLIC_BASE_URL = import.meta.env.VITE_PUBLIC_URL || 'http://localhost:3333'

interface FetchOptions extends RequestInit {
  token?: string
  tenantId?: string
}

export async function apiFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const { token, tenantId, ...init } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId
  }

  const url = `${API_BASE_URL}${endpoint}`

  // Criar AbortController para timeout de 5 segundos
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `Erro ${response.status}`)
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout na requisição (5s)')
    }
    throw error
  }
}

export async function appFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const { token, tenantId, ...init } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId
  }

  const url = `${APP_BASE_URL}${endpoint}`

  // Criar AbortController para timeout de 5 segundos
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `Erro ${response.status}`)
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout na requisição (5s)')
    }
    throw error
  }
}

export async function publicFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const { ...init } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers
  }

  const url = `${PUBLIC_BASE_URL}${endpoint}`

  // Criar AbortController para timeout de 5 segundos
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Erro ${response.status}`
      }
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        message: 'Timeout na requisição (5s)'
      }
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao buscar dados'
    }
  }
}
