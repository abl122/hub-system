import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/LandingPage.vue'),
    meta: { title: 'MK-Edge - Gestão para Provedores' }
  },
  {
    path: '/portal',
    component: () => import('@/views/PortalLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        redirect: { name: 'portal-login' }
      },
      {
        path: 'login',
        name: 'portal-login',
        component: () => import('@/views/portal/PortalLogin.vue'),
        meta: { title: 'Portal - Login' }
      },
      {
        path: 'register/:planSlug?',
        name: 'portal-register',
        component: () => import('@/views/portal/PortalRegister.vue'),
        meta: { title: 'Portal - Registro' }
      },
      {
        path: 'dashboard',
        name: 'portal-dashboard',
        component: () => import('@/views/portal/PortalDashboard.vue'),
        meta: { title: 'Portal - Dashboard', requiresAuth: true }
      },
      {
        path: 'subscription',
        name: 'portal-subscription',
        component: () => import('@/views/portal/PortalSubscription.vue'),
        meta: { title: 'Portal - Assinatura', requiresAuth: true }
      },
      {
        path: 'payments',
        name: 'portal-payments',
        component: () => import('@/views/portal/PortalPayments.vue'),
        meta: { title: 'Portal - Pagamentos', requiresAuth: true }
      },
      {
        path: 'install',
        name: 'portal-install',
        component: () => import('@/views/portal/PortalInstall.vue'),
        meta: { title: 'Portal - Instalação', requiresAuth: true }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/views/AdminLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        redirect: { name: 'admin-login' }
      },
      {
        path: 'login',
        name: 'admin-login',
        component: () => import('@/views/admin/AdminLogin.vue'),
        meta: { title: 'Admin - Login' }
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: { title: 'Admin - Dashboard', requiresAuth: true }
      },
      {
        path: 'tenants',
        name: 'admin-tenants',
        component: () => import('@/views/admin/AdminTenants.vue'),
        meta: { title: 'Admin - Tenants', requiresAuth: true }
      },
      {
        path: 'plans',
        name: 'admin-plans',
        component: () => import('@/views/admin/AdminPlans.vue'),
        meta: { title: 'Admin - Planos', requiresAuth: true }
      },
      {
        path: 'subscriptions',
        name: 'admin-subscriptions',
        component: () => import('@/views/admin/AdminSubscriptions.vue'),
        meta: { title: 'Admin - Assinaturas', requiresAuth: true }
      },
      {
        path: 'efi',
        name: 'admin-efi',
        component: () => import('@/views/admin/AdminEFI.vue'),
        meta: { title: 'Admin - EFI Pagamentos', requiresAuth: true }
      },
      {
        path: 'sms',
        name: 'admin-sms',
        component: () => import('@/views/admin/AdminSMS.vue'),
        meta: { title: 'Admin - SMS', requiresAuth: true }
      },
      {
        path: 'zapi',
        name: 'admin-zapi',
        component: () => import('@/views/admin/AdminZApi.vue'),
        meta: { title: 'Admin - Z-API (WhatsApp)', requiresAuth: true }
      },
      {
        path: 'email',
        name: 'admin-email',
        component: () => import('@/views/admin/AdminEmail.vue'),
        meta: { title: 'Admin - Email', requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Guard para verificar autenticação
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  // Atualizar título da página
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Determinar o tipo de autenticação necessária
  const isAdminRoute = to.path.startsWith('/admin')
  const isPortalRoute = to.path.startsWith('/portal')

  if (requiresAuth) {
    if (isAdminRoute && !authStore.isAdminAuthenticated) {
      next({ name: 'admin-login' })
    } else if (isPortalRoute && !authStore.isPortalAuthenticated) {
      next({ name: 'portal-login' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
