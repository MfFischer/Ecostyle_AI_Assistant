# AI Assistant Chat Workflow Design

## Overview
This n8n workflow handles multilingual chat requests with voice input/output, knowledge retrieval, e-commerce integration, and GDPR-compliant logging.

## Workflow Architecture

### 1. Webhook Trigger
- **Node**: Webhook
- **Path**: `/webhook/chat`
- **Methods**: POST
- **Purpose**: Receives chat requests from frontend
- **Input Format**:
  ```json
  {
    "type": "text|voice",
    "message": "user message text",
    "language": "en|de",
    "sessionId": "uuid",
    "timestamp": "ISO string",
    "audio": "base64 or file upload for voice"
  }
  ```

### 2. Input Processing Branch
- **IF Node**: Check input type (text vs voice)
- **Branch A**: Text input → proceed to language detection
- **Branch B**: Voice input → Whisper STT → language detection

### 3. Speech-to-Text (Voice Branch)
- **Node**: HTTP Request to OpenAI Whisper API
- **Purpose**: Convert audio to text
- **Configuration**:
  - URL: `https://api.openai.com/v1/audio/transcriptions`
  - Method: POST
  - Headers: Authorization with OpenAI API key
  - Body: FormData with audio file and model="whisper-1"

### 4. Language Detection
- **Node**: Code Node (JavaScript)
- **Purpose**: Detect German vs English
- **Logic**: 
  - Simple keyword-based detection
  - Common German words vs English words
  - Fallback to user-specified language

### 5. Knowledge Base Search (RAG)
- **Node**: HTTP Request to Qdrant
- **Purpose**: Vector similarity search
- **Configuration**:
  - URL: `http://localhost:6333/collections/knowledge_base/points/search`
  - Method: POST
  - Body: Vector query with user message embedding
- **Embedding**: Use OpenAI embeddings API to convert text to vector

### 6. E-commerce API Integration
- **Node**: HTTP Request (conditional)
- **Purpose**: Fetch product data when needed
- **Trigger**: Keywords like "price", "stock", "available", "product"
- **Mock API**: Simple REST endpoint returning product info
- **Real API**: Shopify API integration

### 7. LLM Response Generation
- **Node**: OpenAI Chat Model
- **Purpose**: Generate contextual response
- **Configuration**:
  - Model: gpt-4o-mini
  - System prompt with context from knowledge base and e-commerce data
  - User message in detected language
  - Response in same language

### 8. Text-to-Speech (Optional)
- **Node**: HTTP Request to TTS service
- **Purpose**: Convert response to audio
- **Options**:
  - OpenAI TTS API
  - ElevenLabs free tier
  - Local Coqui TTS
- **Output**: Audio file URL or base64

### 9. Data Anonymization
- **Node**: Code Node (JavaScript)
- **Purpose**: Remove PII before logging
- **Process**:
  - Hash user messages
  - Remove email addresses, phone numbers
  - Keep only essential metadata

### 10. Database Logging
- **Node**: Postgres
- **Purpose**: Store conversation data
- **Tables**: conversations, user_sessions, knowledge_base_queries
- **Data**: Anonymized conversation, response time, language, etc.

### 11. Response Formatting
- **Node**: Code Node (JavaScript)
- **Purpose**: Format final response for frontend
- **Output**:
  ```json
  {
    "success": true,
    "message": "AI response text",
    "language": "en|de",
    "audioUrl": "optional audio file URL",
    "processingTime": 1234
  }
  ```

## Node Configuration Details

### Webhook Node
```json
{
  "httpMethod": "POST",
  "path": "chat",
  "responseMode": "responseNode",
  "options": {}
}
```

### OpenAI Whisper (STT)
```json
{
  "url": "https://api.openai.com/v1/audio/transcriptions",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{ $env.OPENAI_API_KEY }}"
  },
  "body": {
    "file": "{{ $binary.audio }}",
    "model": "whisper-1",
    "language": "{{ $json.language }}"
  }
}
```

### Qdrant Vector Search
```json
{
  "url": "http://localhost:6333/collections/knowledge_base/points/search",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "vector": "{{ $json.embedding }}",
    "limit": 5,
    "with_payload": true
  }
}
```

### OpenAI Chat Completion
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful multilingual AI assistant for an e-commerce store..."
    },
    {
      "role": "user", 
      "content": "{{ $json.userMessage }}"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

### PostgreSQL Logging
```sql
INSERT INTO conversations (
  session_id, user_message_hash, user_language, 
  bot_response, response_language, has_voice_input, 
  has_voice_output, processing_time_ms, knowledge_base_hits, 
  ecommerce_api_called
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
)
```

## Error Handling
- Try-catch blocks around external API calls
- Fallback responses for service failures
- Graceful degradation (text-only if TTS fails)
- Error logging to separate table

## Environment Variables Required
- `OPENAI_API_KEY`: OpenAI API access
- `QDRANT_URL`: Vector database URL
- `POSTGRES_CONNECTION`: Database connection string
- `SHOPIFY_API_KEY`: E-commerce API access
- `ELEVENLABS_API_KEY`: TTS service (optional)

## Performance Considerations
- Parallel execution where possible
- Caching for frequent queries
- Connection pooling for database
- Rate limiting awareness for APIs
