# Build image
FROM node: 22.14.0 as build
Working directory /app
# Add package to npm package install
Copy package*.json./
Run npm config set cache /app/.npm-cache --global
Run npm ci --loglevel=error
# Defaults to .dockerignore (defaults to .dockerignore).
Copy . .
# Next chapter
Run npm run build
#The first step in China's economic development
Run npm prune --production

# Production image
From node: 22.14.0-alpine
ENV NODE_ENV production
Run npm config set cache /app/.npm-cache --global
User 3301
Working directory /app
# Add node_modules
Copy --chown=node:node --from=build /app/node_modules ./node_modules
# Next.js - The first step in Next (.next) development
Copy --chown=node:node --from=build /app/.next ./.next
# Open package.json (default file format is not supported)
Copy --chown=node:node --from=build /app/package.json ./package.json
# Next.config.ts (may be a configuration file)
Copy --chown=node:node --from=build /app/next.config.ts ./next.config.ts
# Public domain
Copy --chown=node:node --from=build/app/public ./public
Exposure 3000
# Next.js is a free and open source project
CMD [ "npm", "Run", "Start" ]
