# Etapa 1 - Build
FROM node:20-slim AS builder

WORKDIR /app

# Dependências do Prisma
RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

# Copiar dependências e instalar
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build


# Etapa 2 - Runner (imagem final mais leve)
FROM node:20-slim AS runner

WORKDIR /app

# Instalar dependências mínimas necessárias
RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

# Copiar somente arquivos necessários
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
