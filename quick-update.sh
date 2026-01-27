#!/bin/bash

##############################################################################
# Script SIMPLIFICADO para atualizar hub-system
# Não precisa de git pull, recria do zero
##############################################################################

echo ""
echo "========================================"
echo "🚀 Atualizando hub-system"
echo "========================================"
echo ""

# 1. Parar e remover container atual
echo "🛑 Parando hub-system..."
docker stop hub-system 2>/dev/null
docker rm hub-system 2>/dev/null

echo "✅ Container removido"
echo ""

# 2. Localizar docker-compose.yml
echo "🔍 Procurando docker-compose do hub-system..."

COMPOSE_PATHS=(
    "/opt/mk-edge/hub-system"
    "/root/mk-edge/hub-system"
    "/home/mk-edge/hub-system"
    "$(find /opt -name "docker-compose.yml" -path "*/hub-system/*" 2>/dev/null | head -n1 | xargs dirname)"
)

COMPOSE_DIR=""
for path in "${COMPOSE_PATHS[@]}"; do
    if [ -f "$path/docker-compose.yml" ]; then
        COMPOSE_DIR="$path"
        break
    fi
done

if [ -z "$COMPOSE_DIR" ]; then
    echo "❌ docker-compose.yml do hub-system não encontrado!"
    echo ""
    echo "Por favor, execute manualmente:"
    echo "  cd /caminho/do/hub-system"
    echo "  docker-compose down"
    echo "  docker-compose up -d --build"
    exit 1
fi

cd "$COMPOSE_DIR"
echo "✅ Encontrado em: $COMPOSE_DIR"
echo ""

# 3. Criar .env com URLs corretas
echo "📝 Criando .env com URLs corretas..."
cat > .env << 'EOF'
VITE_API_URL=https://mk-edge.com.br/api
VITE_PUBLIC_URL=https://mk-edge.com.br
VITE_TENANT_DOMAIN=provedor.updata.com.br
EOF

echo "✅ Arquivo .env criado:"
cat .env
echo ""

# 4. Rebuild e up
echo "🔨 Reconstruindo imagem (pode levar alguns minutos)..."
docker-compose build --no-cache

echo ""
echo "🚀 Iniciando hub-system..."
docker-compose up -d

echo ""
echo "⏳ Aguardando container iniciar..."
sleep 10

# 5. Verificações
echo ""
echo "📊 Status do container:"
docker ps | grep hub-system

echo ""
echo "🔍 Variáveis de ambiente do container:"
docker exec hub-system env | grep VITE || echo "(Variáveis VITE foram compiladas no build)"

echo ""
echo "📋 Últimos logs:"
docker logs hub-system --tail 20

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "🌐 Teste em: https://mk-edge.com.br"
echo "🔍 Verifique o console do navegador (F12) para confirmar que usa mk-edge.com.br"
echo ""
