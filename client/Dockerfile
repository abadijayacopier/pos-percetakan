# Stage 1: Build
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

# Build with production base URL (/ for web, ./ for Electron)
ENV VITE_BASE_URL=/
RUN npm run build

# Stage 2: Production nginx
FROM nginx:stable-alpine AS production-stage

# Copy built files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directory for SSL certs
RUN mkdir -p /etc/nginx/ssl

# Non-root nginx
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
