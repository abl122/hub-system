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
RUN npm ci

# Copiar código
COPY . .

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Start serve
CMD ["serve", "-s", "dist", "-l", "80"]
