# Free TTS Service Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl

# Install gTTS Python package
RUN pip3 install gTTS

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create audio directory
RUN mkdir -p /app/audio

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Start the service
CMD ["npm", "start"]
