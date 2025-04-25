# Build image
FROM node:22.14.0 AS build
WORKDIR /app
COPY package*.json ./
RUN npm config set cache /app/.npm-cache --global
RUN npm ci --loglevel=error
COPY . .
RUN npm run build
RUN npm prune --production

# Production image
FROM node:22.14.0-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN npm config set cache /app/.npm-cache --global
USER 3301
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/.next ./.next
COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/next.config.ts ./next.config.ts
COPY --chown=node:node --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
