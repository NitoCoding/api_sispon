# Build stage
FROM node:18-alpine3.18-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies with minimal size
RUN npm ci --only=production --no-audit --no-optional && \
    npm cache clean --force && \
    rm -rf /root/.npm/_cacache

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate && \
    rm -rf /root/.cache

# Copy source code
COPY . .

# Production stage with minimal image
FROM node:18-alpine3.18-slim

# Set working directory
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

# Expose API port
EXPOSE 8000

# Set Node.js to production mode
ENV NODE_ENV=production

# Run the application
CMD ["npm", "run", "dev"]
