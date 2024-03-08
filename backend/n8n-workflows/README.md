# n8n Workflow Configuration

This directory contains the n8n workflow definitions for the EcoStyle AI Assistant.

## Workflow Files

- `ai-assistant-chat-workflow.json` - Main production workflow
- `ai-assistant-chat-workflow-FIXED.json` - Alternative workflow configuration
- `chat-workflow-design.md` - Workflow design documentation

## Setup Instructions

### 1. Environment Variables

Before importing the workflows into n8n, you need to set up the following environment variables:

```bash
# Required API Keys
GEMINI_API_KEY=your-google-gemini-api-key-here

# Optional: Other service configurations
QDRANT_URL=http://localhost:6333
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
```

### 2. Setting Environment Variables in n8n

#### Option A: Using Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  n8n:
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
```

#### Option B: Using n8n CLI

```bash
export GEMINI_API_KEY="your-api-key-here"
n8n start
```

#### Option C: Using .env file

Create a `.env` file in your n8n directory:

```env
GEMINI_API_KEY=your-google-gemini-api-key-here
```

### 3. Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your environment variables

**Note**: Keep your API key secure and never commit it to version control!

### 4. Importing Workflows

1. Open n8n at `http://localhost:5678`
2. Click on "Workflows" in the left sidebar
3. Click "Import from File"
4. Select `ai-assistant-chat-workflow.json`
5. The workflow will be imported with environment variable references
6. Activate the workflow

## Security Best Practices

- ✅ **DO**: Use environment variables for API keys
- ✅ **DO**: Rotate API keys regularly
- ✅ **DO**: Use different keys for development and production
- ❌ **DON'T**: Hardcode API keys in workflow files
- ❌ **DON'T**: Commit API keys to version control
- ❌ **DON'T**: Share API keys in screenshots or documentation

## Workflow Features

The main workflow includes:

1. **Webhook Trigger** - Receives chat messages from frontend
2. **Language Detection** - Identifies German or English
3. **Speech-to-Text** - Converts voice input to text
4. **Vector Search** - Retrieves relevant context from Qdrant
5. **LLM Processing** - Generates responses using Google Gemini
6. **Text-to-Speech** - Converts responses to audio
7. **Response Formatting** - Prepares output for frontend

## Troubleshooting

### Error: "GEMINI_API_KEY is not defined"

**Solution**: Make sure the environment variable is set before starting n8n:

```bash
export GEMINI_API_KEY="your-key-here"
n8n start
```

### Error: "Invalid API key"

**Solution**: 
1. Verify your API key is correct
2. Check if the key has the necessary permissions
3. Ensure the key hasn't been revoked or expired

### Workflow not activating

**Solution**:
1. Check all required environment variables are set
2. Verify webhook URLs are accessible
3. Check n8n logs for detailed error messages

## Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Project Setup Guide](../../docs/SETUP_GUIDE.md)

