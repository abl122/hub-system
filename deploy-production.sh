#!/bin/bash

# Script de Deploy Correto do Hub-System
# Garante que o build usa as variáveis corretas do .env.production

echo "🚀 Deploy Hub-System para mk-edge.com.br"
echo "=========================================="
echo ""

# Certifica que estamos no diretório correto
cd "$(dirname "$0")"

# Mostra as variáveis que serão usadas
echo "📋 Variáveis de ambiente do .env.production:"
cat .env.production
echo ""

# Limpa builds antigos
echo "🧹 Limpando build anterior..."
rm -rf dist/
rm -rf node_modules/.vite/

# Build com .env.production
echo ""
echo "🔨 Fazendo build com .env.production..."
npm run build

echo ""
echo "✅ Build concluído!"
echo ""
echo "📦 Próximos passos:"
echo "1. Parar o container no servidor: docker stop hub-system && docker rm hub-system"
echo "2. Fazer push da imagem Docker (se usar Docker Hub)"
echo "3. OU copiar a pasta dist/ para o servidor"
echo "4. Rebuild do container no Portainer"
echo ""
