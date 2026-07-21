# Prune the monorepo using Turborepo
FROM node:22-alpine AS pruner

WORKDIR /app
RUN npm install -g turbo
COPY . .

# Extracts only deps and source files needed for api
RUN turbo prune --scope=api --out-dir=out --docker

# Install dependencies
FROM node:22-alpine AS installer

WORKDIR /app
ENV CI=true

RUN corepack enable && corepack prepare pnpm@latest-11 --activate

# Copy only pruned lockfile and package.json
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Build
FROM node:22-alpine AS builder

WORKDIR /app
ENV CI=true

RUN corepack enable && corepack prepare pnpm@latest-11 --activate

# Copy node_modules and dependencies structure 
COPY --from=installer /app ./
# Copy pruned source files
COPY --from=pruner /app/out/full/ ./

# Generate Prisma database schemas
RUN pnpm turbo run db:generate

# Build
RUN pnpm turbo run build --filter=api

# Deploy api package into a self-contained directory with production dependencies
RUN pnpm --filter=api --prod deploy /app/pruned --legacy

# Copy the compiled dist files into the pruned deployment folder
RUN cp -r apps/api/dist /app/pruned/dist

# Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy self-contained pruned app
COPY --from=builder /app/pruned /app

EXPOSE 5001

CMD ["node", "dist/main.js"]