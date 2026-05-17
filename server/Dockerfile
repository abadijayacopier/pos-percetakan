FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (bcrypt, sqlite3)
RUN apk add --no-cache python3 make g++ 

# Copy package files first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads backups temp

# Remove dev/test files
RUN rm -rf database/pos.sqlite database/*.log .env test_* scratch/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api || exit 1

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S posapp -u 1001 -G nodejs && \
    chown -R posapp:nodejs /app

USER posapp

EXPOSE 5001

CMD ["node", "index.js"]
