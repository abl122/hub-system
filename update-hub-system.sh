#!/bin/bash

##############################################################################
# Script para atualizar hub-system no servidor com as URLs corretas
# Execute no servidor: bash /tmp/update-hub-system.sh
##############################################################################

echo ""
echo "========================================"
echo "🚀 Atualizando hub-system"
echo "========================================"
echo ""

# Caminho do projeto (ajuste se necessário)
PROJECT_PATH="/opt/mk-edge"

if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ Diretório $PROJECT_PATH não encontrado!"
    echo "Por favor, ajuste PROJECT_PATH no script"
    exit 1
fi

cd "$PROJECT_PATH"
echo "📂 Diretório: $(pwd)"
echo ""

# Pull do Git
echo "📥 Baixando atualizações do Git..."
git pull origin main || git pull origin master

echo ""
echo "📝 Criando .env de produção para hub-system..."
cd hub-system

cat > .env << 'EOF'
VITE_API_URL=https://mk-edge.com.br/api
VITE_PUBLIC_URL=https://mk-edge.com.br
VITE_TENANT_DOMAIN=provedor.updata.com.br
EOF

echo "✅ Arquivo .env criado:"
cat .env
echo ""

# Parar container atual
echo "🛑 Parando hub-system..."
docker-compose down

echo ""
echo "🔨 Reconstruindo imagem (sem cache)..."
docker-compose build --no-cache

echo ""
echo "🚀 Iniciando hub-system..."
docker-compose up -d

echo ""
echo "⏳ Aguardando container iniciar (15s)..."
sleep 15

echo ""
echo "📊 Status do container:"
docker ps | grep hub-system

echo ""
echo "📋 Últimos logs:"
docker logs hub-system --tail 30

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "🔍 Verifique em: https://mk-edge.com.br"
echo ""
