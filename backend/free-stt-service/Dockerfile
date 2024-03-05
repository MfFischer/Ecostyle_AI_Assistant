# Free STT Service Dockerfile
FROM node:18-alpine

# Install system dependencies for building Whisper.cpp
RUN apk add --no-cache \
    build-base \
    cmake \
    git \
    curl \
    bash \
    ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories
RUN mkdir -p /app/models /app/uploads

# Clone and build Whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    make && \
    chmod +x main

# Download Whisper model
RUN cd whisper.cpp && \
    bash ./models/download-ggml-model.sh base.en && \
    cp models/ggml-base.en.bin /app/models/ || \
    echo "Model download failed - will need manual setup"

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# Start the service
CMD ["npm", "start"]
