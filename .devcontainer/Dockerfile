# syntax=docker/dockerfile:1.4
FROM node:22-bookworm-slim

# Metadatos del entorno de contención
LABEL maintainer="Auditoría Seguridad 09-clima-por-ciudad"
LABEL description="Entorno de compilación, ejecución y pruebas con aislamiento estricto"

# 1. Instalar utilidades esenciales para linters, control de versiones y auditoría de red
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    procps \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

# 2. Configurar directorio base de trabajo
WORKDIR /workspace

# 3. Pre-crear directorio node_modules con propiedad del usuario no privilegiado 'node' (UID 1000:GID 1000)
# Esto asegura que al montar el volumen nombrado en Docker, este herede la propiedad correcta
RUN mkdir -p /workspace/node_modules \
    && chown -R node:node /workspace

# 4. Establecer usuario de ejecución no privilegiado
USER node

# 5. Variables de entorno seguras para el runtime
ENV NODE_ENV=development
ENV NPM_CONFIG_AUDIT=true
