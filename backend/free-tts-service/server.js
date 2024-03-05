const express = require('express');
const cors = require('cors');
const gTTS = require('gtts');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3003;

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, 'audio');
fs.ensureDirSync(audioDir);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/audio', express.static(audioDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Free TTS Service',
    timestamp: new Date().toISOString() 
  });
});

// Text-to-Speech endpoint
app.post('/tts', async (req, res) => {
  try {
    const { text, language = 'en', sessionId } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: 'Text is required' 
      });
    }

    // Generate unique filename
    const audioId = sessionId || uuidv4();
    const filename = `${audioId}.mp3`;
    const filepath = path.join(audioDir, filename);

    // Map language codes (Gemini uses 'de', gTTS uses 'de')
    const languageMap = {
      'en': 'en',
      'de': 'de',
      'english': 'en',
      'german': 'de'
    };

    const ttsLanguage = languageMap[language.toLowerCase()] || 'en';

    console.log(`🎵 Generating TTS for: "${text.substring(0, 50)}..." in ${ttsLanguage}`);

    // Create gTTS instance
    const gtts = new gTTS(text, ttsLanguage);

    // Generate audio file
    await new Promise((resolve, reject) => {
      gtts.save(filepath, (err) => {
        if (err) {
          console.error('gTTS Error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Return audio URL
    const audioUrl = `http://localhost:${PORT}/audio/${filename}`;
    
    console.log(`✅ TTS generated: ${audioUrl}`);

    res.json({
      success: true,
      audioUrl,
      filename,
      language: ttsLanguage,
      textLength: text.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({
      error: 'TTS generation failed',
      message: error.message
    });
  }
});

// Batch TTS endpoint (for multiple texts)
app.post('/tts/batch', async (req, res) => {
  try {
    const { texts, language = 'en' } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ 
        error: 'Texts array is required' 
      });
    }

    const results = [];

    for (const text of texts) {
      try {
        const audioId = uuidv4();
        const filename = `${audioId}.mp3`;
        const filepath = path.join(audioDir, filename);
        
        const gtts = new gTTS(text, language);
        
        await new Promise((resolve, reject) => {
          gtts.save(filepath, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        results.push({
          text: text.substring(0, 50) + '...',
          audioUrl: `http://localhost:${PORT}/audio/${filename}`,
          filename
        });
      } catch (error) {
        results.push({
          text: text.substring(0, 50) + '...',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      total: texts.length,
      successful: results.filter(r => !r.error).length
    });

  } catch (error) {
    console.error('Batch TTS Error:', error);
    res.status(500).json({
      error: 'Batch TTS generation failed',
      message: error.message
    });
  }
});

// List available audio files
app.get('/audio/list', async (req, res) => {
  try {
    const files = await fs.readdir(audioDir);
    const audioFiles = files
      .filter(file => file.endsWith('.mp3'))
      .map(file => ({
        filename: file,
        url: `http://localhost:${PORT}/audio/${file}`,
        created: fs.statSync(path.join(audioDir, file)).birthtime
      }))
      .sort((a, b) => b.created - a.created);

    res.json({
      success: true,
      files: audioFiles,
      total: audioFiles.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list audio files',
      message: error.message
    });
  }
});

// Clean up old audio files (older than 24 hours)
app.delete('/audio/cleanup', async (req, res) => {
  try {
    const files = await fs.readdir(audioDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.mp3')) {
        const filepath = path.join(audioDir, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.birthtime.getTime() > maxAge) {
          await fs.remove(filepath);
          deletedCount++;
        }
      }
    }

    res.json({
      success: true,
      deletedFiles: deletedCount,
      message: `Cleaned up ${deletedCount} old audio files`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 Free TTS Service running on port ${PORT}`);
  console.log(`📁 Audio files stored in: ${audioDir}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🎤 TTS endpoint: http://localhost:${PORT}/tts`);
});

module.exports = app;
