# Backend Development Dockerfile
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install --no-optional --legacy-peer-deps

# Copy source code
COPY . .

# Create non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nestjs

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Start the application in development mode
CMD ["npm", "run", "start:dev"]
