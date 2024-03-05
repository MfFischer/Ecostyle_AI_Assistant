const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const app = express();
const PORT = process.env.PORT || 3004;

// Create directories
const uploadDir = path.join(__dirname, 'uploads');
const modelsDir = path.join(__dirname, 'models');
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(modelsDir);

// Multer configuration for file uploads
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Free STT Service (Whisper.cpp)',
    timestamp: new Date().toISOString(),
    whisperAvailable: fs.existsSync(path.join(__dirname, 'whisper.cpp', 'main'))
  });
});

// Convert audio to WAV format using ffmpeg
async function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpeg, [
      '-i', inputPath,
      '-ar', '16000',  // 16kHz sample rate
      '-ac', '1',      // mono
      '-c:a', 'pcm_s16le', // 16-bit PCM
      outputPath,
      '-y'             // overwrite output file
    ]);

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpegProcess.on('error', reject);
  });
}

// Run Whisper.cpp transcription
async function transcribeWithWhisper(audioPath, language = 'auto') {
  return new Promise((resolve, reject) => {
    const whisperPath = path.join(__dirname, 'whisper.cpp', 'main');
    const modelPath = path.join(modelsDir, 'ggml-base.en.bin');
    
    // Check if Whisper executable exists
    if (!fs.existsSync(whisperPath)) {
      reject(new Error('Whisper.cpp not found. Run setup first.'));
      return;
    }

    // Check if model exists
    if (!fs.existsSync(modelPath)) {
      reject(new Error('Whisper model not found. Run setup first.'));
      return;
    }

    const args = [
      '-m', modelPath,
      '-f', audioPath,
      '--output-txt'
    ];

    // Add language parameter if specified
    if (language !== 'auto' && language !== 'en') {
      args.push('-l', language);
    }

    console.log(`🎤 Running Whisper: ${whisperPath} ${args.join(' ')}`);

    const whisperProcess = spawn(whisperPath, args);
    
    let output = '';
    let error = '';

    whisperProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    whisperProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    whisperProcess.on('close', (code) => {
      if (code === 0) {
        // Read the generated text file
        const txtFile = audioPath.replace('.wav', '.txt');
        if (fs.existsSync(txtFile)) {
          const transcription = fs.readFileSync(txtFile, 'utf8').trim();
          fs.removeSync(txtFile); // Clean up
          resolve(transcription);
        } else {
          // Parse output for transcription
          const lines = output.split('\n');
          const transcriptionLine = lines.find(line => 
            line.includes('[') && line.includes(']') && !line.includes('whisper.cpp')
          );
          
          if (transcriptionLine) {
            // Extract text between brackets
            const match = transcriptionLine.match(/\]\s*(.+)$/);
            resolve(match ? match[1].trim() : '');
          } else {
            resolve('');
          }
        }
      } else {
        reject(new Error(`Whisper process failed: ${error || 'Unknown error'}`));
      }
    });

    whisperProcess.on('error', (err) => {
      reject(new Error(`Failed to start Whisper: ${err.message}`));
    });
  });
}

// Speech-to-Text endpoint
app.post('/stt', upload.single('audio'), async (req, res) => {
  let tempFiles = [];
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Audio file is required' 
      });
    }

    const { language = 'auto' } = req.body;
    const audioId = uuidv4();
    
    console.log(`🎤 Processing STT for file: ${req.file.originalname}`);

    // Convert to WAV format
    const wavPath = path.join(uploadDir, `${audioId}.wav`);
    tempFiles.push(req.file.path, wavPath);
    
    await convertToWav(req.file.path, wavPath);
    console.log(`🔄 Converted to WAV: ${wavPath}`);

    // Transcribe with Whisper
    const transcription = await transcribeWithWhisper(wavPath, language);
    
    console.log(`✅ Transcription: "${transcription}"`);

    res.json({
      success: true,
      text: transcription,
      language: language === 'auto' ? 'detected' : language,
      audioId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('STT Error:', error);
    res.status(500).json({
      error: 'Speech-to-text failed',
      message: error.message
    });
  } finally {
    // Clean up temporary files
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.removeSync(file);
      }
    });
  }
});

// Setup endpoint to check Whisper installation
app.get('/setup/status', (req, res) => {
  const whisperPath = path.join(__dirname, 'whisper.cpp', 'main');
  const modelPath = path.join(modelsDir, 'ggml-base.en.bin');
  
  res.json({
    whisperInstalled: fs.existsSync(whisperPath),
    modelDownloaded: fs.existsSync(modelPath),
    whisperPath,
    modelPath,
    setupInstructions: {
      step1: 'git clone https://github.com/ggerganov/whisper.cpp.git',
      step2: 'cd whisper.cpp && make',
      step3: 'bash ./models/download-ggml-model.sh base.en',
      step4: 'Copy ggml-base.en.bin to models/ directory'
    }
  });
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
  console.log(`🎤 Free STT Service running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`🤖 Models directory: ${modelsDir}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🎙️ STT endpoint: http://localhost:${PORT}/stt`);
  console.log(`⚙️ Setup status: http://localhost:${PORT}/setup/status`);
});

module.exports = app;
