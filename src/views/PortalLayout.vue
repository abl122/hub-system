<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ref, computed } from 'vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sidebarOpen = ref(true)

const isLoggedIn = computed(() => authStore.isPortalAuthenticated)
const isLoginRoute = computed(() => route.name === 'portal-login')

const logout = () => {
  authStore.logoutPortal()
  router.push({ name: 'portal-login' })
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div v-if="isLoggedIn && !isLoginRoute" class="portal-layout">
    <header class="portal-header">
      <div class="header-content">
        <button @click="toggleSidebar" class="menu-toggle">☰</button>
        <div class="logo">
          <h1>MK-Edge Portal</h1>
        </div>
        <div class="user-menu" v-if="authStore.isPortalAuthenticated">
          <span>{{ authStore.portalUser?.name }}</span>
          <button @click="logout" class="btn-logout">Sair</button>
        </div>
      </div>
    </header>

    <div class="portal-container">
      <aside class="portal-sidebar" :class="{ 'collapsed': !sidebarOpen }">
        <nav class="sidebar-nav">
          <RouterLink 
            to="/portal/dashboard" 
            class="nav-link"
            :class="{ 'active': route.name === 'portal-dashboard' }"
          >
            <span class="nav-icon">📊</span>
            <span class="nav-text">Dashboard</span>
          </RouterLink>

          <RouterLink 
            to="/portal/subscription" 
            class="nav-link"
            :class="{ 'active': route.name === 'portal-subscription' }"
          >
            <span class="nav-icon">📋</span>
            <span class="nav-text">Assinatura</span>
          </RouterLink>

          <RouterLink 
            to="/portal/payments" 
            class="nav-link"
            :class="{ 'active': route.name === 'portal-payments' }"
          >
            <span class="nav-icon">💳</span>
            <span class="nav-text">Pagamentos</span>
          </RouterLink>

          <RouterLink 
            to="/portal/install" 
            class="nav-link"
            :class="{ 'active': route.name === 'portal-install' }"
          >
            <span class="nav-icon">🚀</span>
            <span class="nav-text">Instalação</span>
          </RouterLink>
        </nav>
      </aside>

      <main class="portal-main">
        <RouterView />
      </main>
    </div>
  </div>
  <div v-else class="portal-unauth-wrapper">
    <RouterView />
  </div>
</template>

<style scoped>
.portal-layout {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.portal-unauth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.portal-header {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  margin-left: -102px;
}

.header-content {
  max-width: 1439px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.header-content > :nth-child(1) {
  display: none;
}

.header-content > :nth-child(3) {
  margin-left: auto;
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    gap: 1rem;
  }

  .logo {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0.75rem;
    gap: 0.5rem;
  }
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #667eea;
}

.logo h1 {
  font-size: 1.5rem;
  color: #667eea;
  margin: 0;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #333;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #5568d3;
}

.portal-container {
  display: flex;
  flex: 1;
  max-width: 1920px;
  margin: 0 auto;
  width: 100%;
}

.portal-sidebar {
  width: 250px;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, width 0.3s;
  position: sticky;
  top: 73px;
  height: calc(100vh - 73px);
  overflow-y: auto;
}

.portal-sidebar.collapsed {
  width: 70px;
}

.sidebar-nav {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: #666;
  text-decoration: none;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.nav-link:hover {
  background: #f9fafb;
  color: #667eea;
}

.nav-link.active {
  background: #f0f4ff;
  color: #667eea;
  border-left-color: #667eea;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.5rem;
  line-height: 1;
  min-width: 1.5rem;
  text-align: center;
}

.nav-text {
  white-space: nowrap;
  transition: opacity 0.3s;
}

.portal-sidebar.collapsed .nav-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.portal-main {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .portal-sidebar {
    position: fixed;
    left: 0;
    top: 73px;
    z-index: 90;
    transform: translateX(0);
  }

  .portal-sidebar.collapsed {
    transform: translateX(-100%);
    width: 250px;
  }

  .portal-main {
    width: 100%;
  }
}
</style>
