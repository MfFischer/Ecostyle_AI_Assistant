# AI Assistant Setup Guide

This guide will help you set up the complete multilingual AI assistant with voice capabilities, vector database, and e-commerce integration.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- OpenAI API key
- Git

## Quick Start

### 1. Environment Setup

Create environment files with your API keys:

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
NEXT_PUBLIC_APP_NAME=AI Assistant
NEXT_PUBLIC_MAX_MESSAGE_LENGTH=1000
NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,de
NEXT_PUBLIC_VOICE_ENABLED=true
NEXT_PUBLIC_DEBUG_MODE=true
```

**Backend** (create `backend/.env`):
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
POSTGRES_DB=ai_assistant
POSTGRES_USER=ai_user
POSTGRES_PASSWORD=ai_password123

# Qdrant Configuration
QDRANT_URL=http://localhost:6333

# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin123

# Optional: TTS Configuration
TTS_ENABLED=true
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# Optional: Shopify API (for real e-commerce)
SHOPIFY_API_KEY=your_shopify_key
SHOPIFY_API_SECRET=your_shopify_secret
```

### 2. Start Backend Services

```bash
# Navigate to backend directory
cd backend/docker-compose

# Start all services (n8n, Qdrant, PostgreSQL, Redis, Ollama)
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 3. Setup Vector Database

```bash
# Navigate to scripts directory
cd ../scripts

# Install dependencies
npm install

# Populate Qdrant with knowledge base data
OPENAI_API_KEY=your_key npm run populate-qdrant
```

### 4. Setup Mock E-commerce API

```bash
# Navigate to mock API directory
cd ../mock-ecommerce-api

# Install dependencies
npm install

# Start the mock API server
npm start
```

### 5. Import n8n Workflow

1. Open n8n at http://localhost:5678
2. Login with admin/admin123
3. Click "Import from File"
4. Select `backend/n8n-workflows/ai-assistant-chat-workflow.json`
5. Configure credentials:
   - Add OpenAI API key
   - Add PostgreSQL connection
   - Test webhook endpoint

### 6. Start Frontend

```bash
# Navigate to frontend directory
cd ../../../frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

## Service URLs

- **Frontend**: http://localhost:3000
- **n8n**: http://localhost:5678 (admin/admin123)
- **Qdrant**: http://localhost:6333
- **PostgreSQL**: localhost:5432
- **Mock E-commerce API**: http://localhost:3001
- **Webhook Endpoint**: http://localhost:5678/webhook/chat

## Testing the System

### 1. Test Frontend
- Open http://localhost:3000
- Try typing a message in English or German
- Test voice input (requires microphone permission)
- Check language switching

### 2. Test n8n Workflow
- Go to n8n dashboard
- Execute the workflow manually
- Check execution logs
- Verify database logging

### 3. Test API Endpoints

**Health Check**:
```bash
curl http://localhost:3001/health
```

**Product Search**:
```bash
curl -X POST http://localhost:3001/api/products/search \
  -H "Content-Type: application/json" \
  -d '{"query": "t-shirt", "language": "en"}'
```

**Qdrant Search**:
```bash
curl http://localhost:6333/collections/knowledge_base/points/scroll
```

## Troubleshooting

### Common Issues

1. **n8n Webhook Not Working**
   - Check if n8n is running on port 5678
   - Verify webhook path is `/webhook/chat`
   - Check n8n logs: `docker-compose logs n8n`

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure key has access to required models

3. **Qdrant Connection Issues**
   - Check if Qdrant is running: `docker-compose ps`
   - Verify collection exists: `curl http://localhost:6333/collections`
   - Re-run populate script if needed

4. **Database Connection Issues**
   - Check PostgreSQL logs: `docker-compose logs postgres`
   - Verify connection string in n8n
   - Check if tables were created

5. **Frontend API Calls Failing**
   - Check browser console for CORS errors
   - Verify n8n webhook URL in .env.local
   - Test webhook directly with curl

### Logs and Debugging

**View Docker logs**:
```bash
docker-compose logs -f [service_name]
```

**Check n8n executions**:
- Go to n8n dashboard → Executions
- Click on failed executions to see details

**Database queries**:
```bash
docker exec -it postgres psql -U ai_user -d ai_assistant
```

## Production Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Update webhook URL to production n8n instance

### Backend (VPS)
1. Copy docker-compose.yml to VPS
2. Update environment variables
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Configure domain names

### Security Considerations
- Change default passwords
- Use environment variables for secrets
- Configure firewall rules
- Enable HTTPS
- Implement rate limiting
- Regular security updates

## Next Steps

1. **Customize Knowledge Base**: Edit `knowledge-base/sample-data.json`
2. **Add More Languages**: Extend language detection and responses
3. **Integrate Real E-commerce**: Replace mock API with Shopify/WooCommerce
4. **Enhance Voice Features**: Add more TTS options
5. **Monitoring**: Add logging and monitoring tools
6. **Testing**: Implement automated tests

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review n8n execution logs
3. Check Docker container logs
4. Verify API keys and configurations
