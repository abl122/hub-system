#!/bin/bash

##############################################################################
# Script para corrigir e rebuildar hub-system
# Copie e cole este script inteiro no terminal SSH
##############################################################################

cd /root/hub-system

echo "📂 Diretório: $(pwd)"
echo ""

# 1. Corrigir Dockerfile
echo "🔧 Corrigindo Dockerfile..."
cat > Dockerfile << 'DOCKERFILE_END'
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Argumentos de build para variáveis de ambiente
ARG VITE_API_URL
ARG VITE_PUBLIC_URL

# Definir como variáveis de ambiente para o Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código
COPY . .

# Debug: Mostrar variáveis de ambiente
RUN echo "🔧 VITE_API_URL=$VITE_API_URL" && echo "🔧 VITE_PUBLIC_URL=$VITE_PUBLIC_URL"

# Build da aplicação
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instalar serve globalmente
RUN npm install -g serve

# Copiar arquivos buildados do builder
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health.html || exit 1

# Comando para servir a aplicação
CMD ["serve", "-s", "dist", "-l", "80"]
DOCKERFILE_END

echo "✅ Dockerfile corrigido"

# 2. Criar .env correto
echo ""
echo "📝 Criando .env com URLs corretas..."
cat > .env << 'ENV_END'
VITE_API_URL=https://mk-edge.com.br/api
VITE_PUBLIC_URL=https://mk-edge.com.br
VITE_TENANT_DOMAIN=provedor.updata.com.br
ENV_END

echo "✅ .env criado:"
cat .env

# 3. Parar e remover container
echo ""
echo "🛑 Parando e removendo container..."
docker stop hub-system 2>/dev/null
docker rm hub-system 2>/dev/null

# 4. Remover imagem antiga (opcional, para forçar rebuild)
echo ""
echo "🗑️  Removendo imagem antiga..."
docker rmi hub-system-hub-system 2>/dev/null || docker rmi hub-system 2>/dev/null || echo "Imagem não encontrada (ok)"

# 5. Build da nova imagem
echo ""
echo "🔨 Construindo nova imagem (pode demorar 3-5 minutos)..."
docker build \
  --build-arg VITE_API_URL=https://mk-edge.com.br/api \
  --build-arg VITE_PUBLIC_URL=https://mk-edge.com.br \
  --no-cache \
  -t hub-system \
  .

# 6. Subir container
echo ""
echo "🚀 Iniciando hub-system..."
docker run -d \
  --name hub-system \
  --restart unless-stopped \
  --network internal_network \
  hub-system

# 6. Verificar
echo ""
echo "⏳ Aguardando 15 segundos..."
sleep 15

echo ""
echo "✅ Status:"
docker ps | grep hub-system

echo ""
echo "📋 Logs:"
docker logs hub-system --tail 30

echo ""
echo "🎉 Pronto! Teste em: https://mk-edge.com.br"
