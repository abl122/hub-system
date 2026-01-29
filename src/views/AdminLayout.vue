<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const sidebarOpen = ref(typeof window !== 'undefined' ? window.innerWidth >= 768 : true)

const isLoggedIn = computed(() => authStore.isAdminAuthenticated)
const isLoginRoute = computed(() => route.name === 'admin-login')
const isMobile = computed(() => windowWidth.value < 768)

const logout = () => {
  authStore.logoutAdmin()
  router.push({ name: 'admin-login' })
}

const navigateTo = (name: string) => {
  router.push({ name })
  if (windowWidth.value < 768) {
    sidebarOpen.value = false
  }
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

onMounted(() => {
  const handleResize = () => {
    windowWidth.value = window.innerWidth
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div v-if="isLoggedIn && !isLoginRoute" class="admin-layout">
    <!-- Overlay for mobile sidebar -->
    <div 
      v-if="sidebarOpen && isMobile"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h2>MK-Edge</h2>
        <button @click="toggleSidebar" class="close-btn">✕</button>
      </div>

      <nav class="admin-nav">
        <a
          @click="navigateTo('admin-dashboard')"
          class="nav-link"
          :class="{ active: $route.name === 'admin-dashboard' }"
        >
          <span class="icon">📊</span>
          <span>Dashboard</span>
        </a>
        <a
          @click="navigateTo('admin-tenants')"
          class="nav-link"
          :class="{ active: $route.name === 'admin-tenants' }"
        >
          <span class="icon">🏢</span>
          <span>Provedores</span>
        </a>
        <a
          @click="navigateTo('admin-plans')"
          class="nav-link"
          :class="{ active: $route.name === 'admin-plans' }"
        >
          <span class="icon">💎</span>
          <span>Planos</span>
        </a>
        <a
          @click="navigateTo('admin-subscriptions')"
          class="nav-link"
          :class="{ active: $route.name === 'admin-subscriptions' }"
        >
          <span class="icon">📜</span>
          <span>Assinaturas</span>
        </a>
        <a
          @click="navigateTo('admin-efi')"
          class="nav-link"
          :class="{ active: $route.name === 'admin-efi' }"
        >
          <span class="icon">💳</span>
          <span>EFI (Pagamentos)</span>
        </a>
        <a
          @click="navigateTo('admin-sms')"
          class="nav-link"
          :class="{ active: $route.name === 'admin-sms' }"
        >
          <span class="icon">📱</span>
          <span>SMS</span>
        </a>
        <a
          @click="navigateTo('admin-zapi')"
          class="nav-link"
          :class="{ active: $route.name === 'admin-zapi' }"
        >
          <span class="icon">💬</span>
          <span>Z-API (WhatsApp)</span>
        </a>
        <a
          @click="navigateTo('admin-email')"
          class="nav-link"
          :class="{ active: $route.name === 'admin-email' }"
        >
          <span class="icon">📧</span>
          <span>Email</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <span>{{ authStore.adminUser?.name }}</span>
        </div>
        <button @click="logout" class="btn-logout">Sair</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <header class="admin-header">
        <button @click="toggleSidebar" class="menu-btn">☰</button>
        <h1>Painel Administrativo</h1>
      </header>

      <div class="main-content">
        <RouterView />
      </div>
    </main>
  </div>
  <div v-else class="login-wrapper">
    <RouterView />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

:root {
  --primary: #667eea;
  --primary-dark: #5568d3;
  --primary-light: #f0f0ff;
  --secondary: #059669;
  --danger: #dc2626;
  --warning: #f59e0b;
  --success: #10b981;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-light: #9ca3af;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
  --border: #e5e7eb;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-light);
}

.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* ===== SIDEBAR ===== */
.admin-sidebar {
  width: 260px;
  background: var(--bg-white);
  border-right: 1px solid var(--border);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 200;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.admin-sidebar::-webkit-scrollbar {
  width: 6px;
}

.admin-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.admin-sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.admin-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 250;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.5px;
}

.close-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  padding: 0.25rem;
  transition: transform 0.2s;
}

.close-btn:hover {
  transform: scale(1.2);
}

.admin-nav {
  flex: 1;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
  margin: 0 0.75rem;
  border-radius: 8px;
  font-weight: 500;
  position: relative;
}

.nav-link:hover {
  background: var(--primary-light);
  color: var(--primary);
  transform: translateX(4px);
}

.nav-link.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--primary);
  border-radius: 0 3px 3px 0;
}

.nav-link .icon {
  font-size: 1.25rem;
  min-width: 24px;
}

.sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-info {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout {
  width: 100%;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s;
  box-shadow: var(--shadow-sm);
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-logout:active {
  transform: translateY(0);
}

/* ===== MAIN CONTENT ===== */
.admin-main {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  background: var(--bg-light);
}

.admin-header {
  background: var(--bg-white);
  border-bottom: 1px solid var(--border);
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.admin-header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.menu-btn {
  display: none;
  width: 52px;
  height: 52px;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-primary);
  padding: 0.5rem;
  transition: transform 0.2s;
}

.menu-btn:hover {
  transform: scale(1.1);
}

.main-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  width: 100%;
  margin-left: 30px;
}

.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .admin-sidebar {
    width: 240px;
  }

  .admin-main {
    margin-left: 240px;
  }

  .admin-header {
    padding: 1rem 1.5rem;
  }

  .main-content {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
  }

  .admin-sidebar {
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 300;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }

  .close-btn {
    display: block;
  }

  .admin-main {
    margin-left: 0;
  }

  .menu-btn {
    display: block;
  }

  .admin-header {
    padding: 24px;
  }

  .admin-header h1 {
    font-size: 1.25rem;
  }

  .main-content {
    padding: 1rem;
    margin-left: 0;
  }

  .nav-link {
    padding: 0.875rem 1.5rem;
    margin: 0 0.5rem;
  }

  .nav-link:hover {
    transform: none;
  }
}

@media (max-width: 480px) {
  .admin-sidebar {
    width: 85vw;
    max-width: 300px;
  }

  .sidebar-header h2 {
    font-size: 1.2rem;
  }

  .admin-header {
    padding: 24px;
  }

  .admin-header h1 {
    font-size: 1rem;
  }

  .main-content {
    padding: 24px;
  }

  .nav-link {
    padding: 0.75rem 1.25rem;
  }
}
</style>
