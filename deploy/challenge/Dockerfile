# Node 24.21.0, pinned to the verified official image digest.
ARG NODE_IMAGE=node@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6
FROM ${NODE_IMAGE} AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY services/challenge/package*.json ./
RUN npm ci
COPY services/challenge/tsconfig.json ./
COPY services/challenge/src ./src
COPY services/challenge/tests ./tests
# Exercise native SQLite/Argon2 on Linux before the deployable artifact exists.
RUN npm run build && npm test && npm prune --omit=dev

FROM ${NODE_IMAGE}
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
