# Build from the repository root. Staging/production execution needs its own gate.
FROM node:24.20.0-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY services/challenge/package*.json ./
RUN npm ci
COPY services/challenge/tsconfig.json ./
COPY services/challenge/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:24.20.0-bookworm-slim
ENV NODE_ENV=production CHALLENGE_HOST=0.0.0.0 CHALLENGE_PORT=4400
WORKDIR /app
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
# Mount a privately reviewed bank at runtime; never bake answers into a public image.
USER node
EXPOSE 4400
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:4400/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","dist/main.js"]
