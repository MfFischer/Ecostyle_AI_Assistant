# 🆓 **Free AI Assistant Setup Guide**

## **Complete Free Stack Implementation**

Your AI assistant now uses **100% FREE** services:

- ✅ **STT**: Whisper.cpp (self-hosted, offline)
- ✅ **TTS**: gTTS (Google Translate TTS, free)
- ✅ **Chat**: Gemini 1.5 Flash (free tier: 15 req/min, 1,500 req/day)
- ✅ **Embeddings**: Gemini text-embedding-004 (free tier: 1M tokens/month)
- ✅ **Vector DB**: Qdrant (free, self-hosted)
- ✅ **Orchestration**: n8n (free, self-hosted)

## **🚀 Quick Start**

### **1. Install Free TTS Service**
```bash
cd backend/free-tts-service
npm install
npm start
# Service runs on http://localhost:3003
```

### **2. Install Free STT Service**
```bash
cd backend/free-stt-service
npm install
npm run setup  # Downloads and builds Whisper.cpp
npm start
# Service runs on http://localhost:3004
```

### **3. Start All Services**
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Free TTS
cd backend/free-tts-service
npm start

# Terminal 3: Free STT  
cd backend/free-stt-service
npm start

# Terminal 4: n8n
npx n8n
```

## **🔧 Service Details**

### **Free TTS Service (Port 3003)**
- **Technology**: gTTS (Google Translate TTS)
- **Languages**: English, German, 100+ others
- **Cost**: Completely free
- **Quality**: Good quality, natural voices
- **Endpoints**:
  - `POST /tts` - Generate speech from text
  - `GET /health` - Health check
  - `GET /audio/list` - List generated audio files

### **Free STT Service (Port 3004)**
- **Technology**: Whisper.cpp (self-hosted OpenAI Whisper)
- **Languages**: 99 languages supported
- **Cost**: Completely free (runs offline)
- **Quality**: Excellent accuracy
- **Setup**: Automatic download and compilation
- **Endpoints**:
  - `POST /stt` - Convert speech to text
  - `GET /health` - Health check
  - `GET /setup/status` - Check installation status

### **Gemini API (Free Tier)**
- **Chat**: gemini-1.5-flash (fast, free)
- **Embeddings**: text-embedding-004
- **Limits**: 15 requests/minute, 1,500 requests/day, 1M tokens/month
- **Cost**: $0.00 (within free tier)

## **📋 Updated Workflow Configuration**

The n8n workflow has been updated to use:

1. **Free STT Node**: `http://localhost:3004/stt`
2. **Free TTS Node**: `http://localhost:3003/tts`
3. **Gemini Chat**: Using your API key `AIzaSyAj0btu828R6Vz2275gMktnE7eOt53oJbQ`
4. **Gemini Embeddings**: Same API key for embeddings

## **🧪 Testing the Free Stack**

### **Test TTS Service**
```bash
curl -X POST http://localhost:3003/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is free text-to-speech!", "language": "en"}'
```

### **Test STT Service**
```bash
# Upload an audio file
curl -X POST http://localhost:3004/stt \
  -F "audio=@your-audio-file.wav" \
  -F "language=auto"
```

### **Test Complete Workflow**
```bash
curl -X POST http://localhost:5678/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test the free AI assistant!", "type": "text", "sessionId": "test123"}'
```

## **💰 Cost Comparison**

| Service | Paid Option | Free Alternative | Monthly Savings |
|---------|-------------|------------------|-----------------|
| STT | OpenAI Whisper ($0.006/min) | Whisper.cpp | ~$50-200 |
| TTS | OpenAI TTS ($15/1M chars) | gTTS | ~$30-100 |
| Chat | OpenAI GPT-4 ($30/1M tokens) | Gemini Flash | ~$100-500 |
| Embeddings | OpenAI ($0.10/1M tokens) | Gemini | ~$20-50 |
| **Total** | **~$200-850/month** | **$0.00** | **$200-850** |

## **🎯 Production Deployment**

For production, consider:

1. **Docker Compose**: All services containerized
2. **Load Balancing**: Multiple instances of free services
3. **Caching**: Redis for API response caching
4. **Monitoring**: Health checks and metrics
5. **Backup**: Regular model and data backups

## **🔄 Scaling Options**

When you outgrow free tiers:

1. **Gemini Pro**: Upgrade to paid Gemini for higher limits
2. **Self-hosted LLM**: Use Ollama with Llama 3.1 or Qwen
3. **Cloud STT/TTS**: Azure Cognitive Services (competitive pricing)
4. **CDN**: CloudFlare for audio file delivery

## **🛠️ Troubleshooting**

### **Whisper.cpp Setup Issues**
```bash
# Manual setup if automatic fails
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make
bash ./models/download-ggml-model.sh base.en
cp models/ggml-base.en.bin ../backend/free-stt-service/models/
```

### **gTTS Issues**
```bash
# If gTTS fails, check internet connection
# gTTS requires internet to access Google Translate
ping translate.google.com
```

### **n8n Workflow Issues**
1. Import the updated `ai-assistant-chat-workflow.json`
2. Activate the workflow
3. Check that all services are running
4. Verify API key is correct

## **🎉 You Now Have**

- ✅ **$0/month AI assistant** (within free tiers)
- ✅ **Production-ready architecture**
- ✅ **Multilingual support** (German/English)
- ✅ **Voice input/output**
- ✅ **E-commerce integration**
- ✅ **Knowledge base (RAG)**
- ✅ **GDPR compliance**
- ✅ **Scalable design**

Your AI assistant is now completely free to run and demonstrates enterprise-level capabilities! 🚀
