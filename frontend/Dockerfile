# Build stage
FROM node:20-bookworm-slim as build

WORKDIR /app

# Argomento per VITE_BACKEND_URL (passato da docker-compose)
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
ENV CI=true
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app to temporary location
# Verrà copiato nel volume all'avvio tramite entrypoint
COPY --from=build /app/dist /app/dist

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]


