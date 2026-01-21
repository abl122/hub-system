import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'

interface AdminUser {
  id: string
  email: string
  role: 'admin'
}

interface PortalUser {
  id: string
  nome: string
  cnpj: string
  plano: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const adminUser = ref<AdminUser | null>(null)
  const portalUser = ref<PortalUser | null>(null)
  const adminToken = ref<string | null>(localStorage.getItem('adminToken'))
  const portalToken = ref<string | null>(localStorage.getItem('portalToken'))

  // Computed
  const isAdminAuthenticated = computed(() => !!adminToken.value && !!adminUser.value)
  const isPortalAuthenticated = computed(() => !!portalToken.value && !!portalUser.value)

  // Actions
  const loginAdmin = async (username: string, password: string) => {
    try {
      const response = await authService.loginAdmin(username, password)

      if (response.success) {
        const token = response.token
        const user: AdminUser = {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role
        }

        adminToken.value = token
        adminUser.value = user
        localStorage.setItem('adminToken', token)
        localStorage.setItem('adminUser', JSON.stringify(user))

        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  const loginPortal = async (cnpj: string, password: string) => {
    try {
      const response = await authService.loginPortal(cnpj, password)

      if (response.success) {
        const token = response.token
        const user: PortalUser = {
          id: response.tenant.id,
          nome: response.tenant.nome,
          cnpj: response.tenant.cnpj,
          plano: response.tenant.plano
        }

        portalToken.value = token
        portalUser.value = user
        localStorage.setItem('portalToken', token)
        localStorage.setItem('portalUser', JSON.stringify(user))
        localStorage.setItem('tenantId', response.tenant.id)
        
        // Salvar agentToken se disponível
        if (response.tenant.agente?.token) {
          localStorage.setItem('agentToken', response.tenant.agente.token)
        }

        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  const logoutAdmin = async () => {
    try {
      if (adminToken.value) {
        await authService.logout(adminToken.value)
      }
    } catch (error) {
      console.error('Erro ao fazer logout admin:', error)
    } finally {
      adminToken.value = null
      adminUser.value = null
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    }
  }

  const logoutPortal = async () => {
    try {
      if (portalToken.value) {
        await authService.logout(portalToken.value)
      }
    } catch (error) {
      // Silent logout
    } finally {
      portalToken.value = null
      portalUser.value = null
      localStorage.removeItem('portalToken')
      localStorage.removeItem('portalUser')
      localStorage.removeItem('tenantId')
    }
  }

  const restoreSession = () => {
    const savedAdminUser = localStorage.getItem('adminUser')
    const savedPortalUser = localStorage.getItem('portalUser')

    if (adminToken.value && savedAdminUser) {
      adminUser.value = JSON.parse(savedAdminUser)
    }

    if (portalToken.value && savedPortalUser) {
      portalUser.value = JSON.parse(savedPortalUser)
    }
  }

  return {
    // State
    adminUser,
    portalUser,
    adminToken,
    portalToken,
    // Computed
    isAdminAuthenticated,
    isPortalAuthenticated,
    // Actions
    loginAdmin,
    loginPortal,
    logoutAdmin,
    logoutPortal,
    restoreSession
  }
})
