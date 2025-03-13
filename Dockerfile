# Gunakan base image Node.js
FROM node:18-alpine

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

# Expose port sesuai dengan API
EXPOSE 8001

# Set Node.js to production mode
ENV NODE_ENV=production

# Run the application
CMD ["npm", "run", "dev"]
