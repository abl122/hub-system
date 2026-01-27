#!/bin/bash

# Script para verificar e corrigir configuração do hub-system no servidor

echo ""
echo "========================================"
echo "🔍 Verificando hub-system no servidor"
echo "========================================"
echo ""

echo "📦 Containers em execução:"
docker ps | grep hub-system
echo ""

echo "🔍 Verificando variáveis de ambiente do hub-system:"
docker exec hub-system env | grep VITE
echo ""

echo "📁 Verificando arquivo .env no container:"
docker exec hub-system cat /app/.env 2>/dev/null || echo "❌ Arquivo .env não encontrado"
echo ""

echo "📋 Logs do hub-system (últimas 20 linhas):"
docker logs hub-system --tail 20
echo ""

echo "✅ Verificação concluída"
