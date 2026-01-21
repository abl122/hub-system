# MK-Edge Hub System

Sistema de gestão de provedores de internet integrado com a API MK-Edge MongoDB.

**Stack**: Vue 3 + TypeScript + Vite + Pinia + Vue Router

---

## 🚀 Quick Start

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Build para Produção
```bash
npm run build
```

### Preview de Produção
```bash
npm run preview
```

---

## 📁 Estrutura do Projeto

```
src/
├── services/
│   ├── api.ts                    # Base HTTP (apiFetch, appFetch, publicFetch)
│   ├── authService.ts            # Login, logout, verificação de token
│   ├── plansService.ts           # CRUD de planos
│   ├── tenantsService.ts         # CRUD de tenants
│   ├── providerService.ts        # Informações do provedor
│   ├── emailService.ts           # Configuração Email/SMTP
│   ├── smsService.ts             # Configuração SMS
│   ├── zapiService.ts            # Integração Z-API WhatsApp
│   └── registerService.ts        # Registro de novos tenants
├── stores/
│   └── auth.ts                   # Estado de autenticação (Pinia)
├── views/
│   ├── admin/
│   │   ├── AdminLogin.vue        # Login administrador
│   │   ├── AdminDashboard.vue    # Dashboard administrativo
│   │   ├── AdminTenants.vue      # Gerenciar tenants/provedores
│   │   ├── AdminPlans.vue        # Gerenciar planos de preço
│   │   ├── AdminEmail.vue        # Configurar Email/SMTP
│   │   ├── AdminSMS.vue          # Configurar SMS
│   │   ├── AdminEFI.vue          # Configurar EFI/Gerencianet
│   │   └── AdminZApi.vue         # Configurar Z-API WhatsApp
│   ├── portal/
│   │   ├── PortalLogin.vue       # Login do provedor
│   │   ├── PortalDashboard.vue   # Dashboard do provedor
│   │   ├── PortalIntegrations.vue # Integrações do provedor
│   │   └── PortalPlans.vue       # Planos do provedor
│   └── LandingPage.vue           # Página inicial pública
├── components/
│   ├── admin/                    # Componentes do painel admin
│   ├── portal/                   # Componentes do portal
│   └── common/                   # Componentes compartilhados
├── router/                       # Definição de rotas
├── App.vue                       # Componente raiz
└── main.ts                       # Ponto de entrada
```

---

## 🔐 Credenciais de Teste

### Painel Administrativo
- **URL**: `http://localhost:5173/admin/login`
- **Usuário**: `admin`
- **Senha**: `Admin123`

### Portal do Provedor
- **URL**: `http://localhost:5173/portal/login`
- **CNPJ**: `04.038.227/0001-87`
- **Senha**: `F@lcon2931`

### Landing Page
- **URL**: `http://localhost:5173/`
- **Acesso público** (sem autenticação necessária)

---

## 📍 Rotas Disponíveis

### Landing Page
- `/` - Página inicial pública com pricing e registro

### Portal do Provedor
- `/portal/login` - Login do portal
- `/portal/dashboard` - Dashboard do provedor (protegido)
- `/portal/integrations` - Gerenciar integrações (protegido)
- `/portal/plans` - Visualizar planos (protegido)

### Painel Administrativo
- `/admin/login` - Login do administrador
- `/admin/dashboard` - Dashboard administrativo (protegido)
- `/admin/tenants` - Gerenciar provedores (protegido)
- `/admin/plans` - Gerenciar planos de preço (protegido)
- `/admin/integrations` - Configurar integrações (protegido)

---

## 🔌 Integrações Disponíveis

### Email (SMTP)
Configuração de servidor SMTP para envio de emails. Suporta autenticação básica.
- **Campos**: Host, Port, User, Password, From Email
- **Teste**: Enviar email de teste para validar configuração

### SMS
Integração com gateway SMS para envio de mensagens SMS.
- **Campos**: URL, User, Password/Token
- **Teste**: Validar conexão com gateway

### EFI (Gerencianet/Pix)
Integração com Gerencianet para pagamentos com Pix e gerar cobranças.
- **Campos**: Client ID, Client Secret, PIX Key
- **Modos**: Sandbox e Produção
- **Recursos**: Cobrança, Pix, Webhooks

### Z-API (WhatsApp)
Integração com Z-API para envio e recebimento de mensagens WhatsApp.
- **Campos**: Instance ID, Instance Token, Security Token
- **Recursos**: Enviar mensagens, Webhooks, Grupos

---

## 🔐 Autenticação

### Sistema de Autenticação
- **Admin**: Baseado em nome de usuário e senha
- **Portal**: Baseado em CNPJ e senha do tenant
- **Landing**: Acesso público, sem autenticação

### Fluxo de Login
1. Usuário entra credenciais
2. Frontend chama `/api/auth/admin/login` ou `/api/auth/portal/login`
3. Backend retorna JWT token
4. Frontend armazena token em `localStorage`
5. Token incluído em todas as requisições autenticadas

### Proteção de Rotas
Rotas protegidas verificam se existe token válido. Se não existir, redirecionam para login.

---

## 🔄 Fluxo de Dados

### Landing Page → Registro
1. Usuário seleciona plano
2. Preenche formulário de cadastro
3. POST `/api/register/create-tenant`
4. Recebe credentials para fazer login

### Admin → Gerenciar Planos
1. Login admin (POST `/api/auth/admin/login`)
2. GET `/api/plans` - Lista planos ativos
3. POST `/api/plans` - Criar novo plano
4. PUT `/api/plans/{id}` - Atualizar plano
5. DELETE `/api/plans/{id}` - Deletar plano

### Portal → Configurar Integrações
1. Login portal (POST `/api/auth/portal/login`)
2. GET `/api/integrations/{type}/config` - Buscar configuração atual
3. POST `/api/integrations/{type}/update` - Salvar configuração
4. POST `/api/integrations/{type}/test` - Testar integração

---

## 🛠️ Desenvolvimento

### Adicionar Novo Serviço
```typescript
// src/services/meuServico.ts
import { apiFetch } from './api'

export const meuServico = {
  async buscarDados(token: string, id: string) {
    return apiFetch(`/meu/endpoint/${id}`, {
      method: 'GET',
      token
    })
  },
  
  async salvarDados(token: string, data: any) {
    return apiFetch('/meu/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })
  }
}
```

### Usar Serviço em Componente
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { meuServico } from '@/services/meuServico'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const dados = ref(null)

const carregarDados = async () => {
  const response = await meuServico.buscarDados(authStore.token, 'id-123')
  if (response.success) {
    dados.value = response.data
  }
}
</script>
```

### Adicionar Nova Rota
```typescript
// src/router/index.ts
const routes = [
  {
    path: '/admin/nova-pagina',
    component: () => import('@/views/admin/NovaPagina.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  }
]
```

---

## 📦 Dependências Principais

- **Vue 3** - Framework progressive JavaScript
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool moderno
- **Pinia** - State management
- **Vue Router** - Roteamento
- **Axios** - HTTP client (via fetch API)

---

## ✅ Checkpoints de Desenvolvimento

- [x] Landing page com pricing dinâmico
- [x] Login admin e portal
- [x] Dashboard admin com estatísticas
- [x] Dashboard portal com integrações
- [x] Gerenciar planos (CRUD)
- [x] Configurar Email, SMS, EFI, Z-API
- [x] Autenticação com JWT
- [x] Proteção de rotas
- [x] Validação de formulários
- [x] Tratamento de erros
- [x] Integração com API backend

---

## 🚀 Deploy

### Build
```bash
npm run build
```

Gera pasta `dist/` pronta para deploy em servidor estático.

### Variáveis de Ambiente para Produção
Criar `.env.production` ou configurar via CI/CD:

```env
VITE_API_URL=https://api.seu-dominio.com
VITE_APP_URL=https://app.seu-dominio.com
VITE_PUBLIC_URL=https://seu-dominio.com
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar console do navegador (F12)
2. Verificar logs do backend em `mk-edge-api`
3. Validar credenciais de teste
4. Verificar conexão com API backend

---

## 📝 Licença

Propriedade da MK-Edge | 2024-2026
- **Vue Router** - Roteamento SPA
- **Pinia** - Gerenciamento de estado
- **CSS3** - Estilos nativos (sem pré-processadores)

## 📦 Dependências Principais

```json
{
  "vue": "^3.5.24",
  "vue-router": "^4.6.4",
  "pinia": "^2.3.1"
}
```

## 🛠️ Configuração

### Path Aliases
O projeto usa `@/` como alias para `src/`:

```typescript
import { useAuthStore } from '@/stores/auth'
import Component from '@/components/MyComponent.vue'
```

### Estilos
- Estilos globais em `src/style.css`
- Estilos por componente usando `<style scoped>`
- Design responsivo com Flexbox e CSS Grid

## 📝 Funcionalidades Implementadas

### Landing Page
- ✅ Hero section
- ✅ Seção de recursos
- ✅ Tabela de preços
- ✅ Links para login
- ✅ Responsivo

### Portal do Cliente
- ✅ Sistema de login
- ✅ Dashboard com estatísticas
- ✅ Atividades recentes
- ✅ Controle de usuário logado
- ✅ Logout

### Painel Administrativo
- ✅ Sistema de login
- ✅ Dashboard com KPIs
- ✅ Gerenciamento de tenants
- ✅ Gerenciamento de planos
- ✅ Sidebar navegável
- ✅ Responsivo
- ✅ Logout

## 🔒 Proteção de Rotas

O Vue Router possui guards que protegem rotas que requerem autenticação:

```typescript
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth
  
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

## 📱 Responsividade

O projeto é totalmente responsivo com breakpoints em:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🚄 Performance

- Code splitting automático por rota
- Build otimizado com Vite
- Assets minificados
- CSS crítico inline

## � Integração com MK-Auth

O MK-Edge foi desenvolvido para funcionar em conjunto com MK-Auth:
- Sincronização de usuários
- Autenticação integrada
- Controle de permissões
- API RESTful

## 📞 Suporte

Para mais informações sobre Vue, Vite e TypeScript, consulte:
- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Guide](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MK-Auth Documentation](https://mk-auth.com.br/)

