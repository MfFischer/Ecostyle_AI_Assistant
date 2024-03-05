const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const whisperDir = path.join(__dirname, 'whisper.cpp');
const modelsDir = path.join(__dirname, 'models');

async function runCommand(command, args, cwd = __dirname) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, { 
      cwd, 
      stdio: 'inherit',
      shell: true 
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', reject);
  });
}

async function setupWhisper() {
  try {
    console.log('🚀 Setting up Whisper.cpp for free STT...');

    // Ensure models directory exists
    fs.ensureDirSync(modelsDir);

    // Step 1: Clone whisper.cpp if not exists
    if (!fs.existsSync(whisperDir)) {
      console.log('📥 Cloning whisper.cpp repository...');
      await runCommand('git', ['clone', 'https://github.com/ggerganov/whisper.cpp.git']);
    } else {
      console.log('✅ whisper.cpp already exists');
    }

    // Step 2: Build whisper.cpp
    console.log('🔨 Building whisper.cpp...');
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // For Windows, try different build methods
      try {
        await runCommand('make', [], whisperDir);
      } catch (error) {
        console.log('⚠️ Make failed, trying with cmake...');
        try {
          await runCommand('cmake', ['-B', 'build'], whisperDir);
          await runCommand('cmake', ['--build', 'build', '--config', 'Release'], whisperDir);
        } catch (cmakeError) {
          console.log('⚠️ CMake failed, trying with Visual Studio...');
          await runCommand('msbuild', ['whisper.sln'], whisperDir);
        }
      }
    } else {
      await runCommand('make', [], whisperDir);
    }

    // Step 3: Download model
    const modelPath = path.join(modelsDir, 'ggml-base.en.bin');
    if (!fs.existsSync(modelPath)) {
      console.log('📥 Downloading Whisper base.en model...');
      
      const modelsScript = path.join(whisperDir, 'models', 'download-ggml-model.sh');
      if (fs.existsSync(modelsScript)) {
        await runCommand('bash', [modelsScript, 'base.en'], whisperDir);
        
        // Copy model to our models directory
        const downloadedModel = path.join(whisperDir, 'models', 'ggml-base.en.bin');
        if (fs.existsSync(downloadedModel)) {
          fs.copySync(downloadedModel, modelPath);
          console.log(`✅ Model copied to: ${modelPath}`);
        }
      } else {
        console.log('⚠️ Download script not found. Please download manually:');
        console.log('   1. Go to: https://huggingface.co/ggerganov/whisper.cpp');
        console.log('   2. Download ggml-base.en.bin');
        console.log(`   3. Place it in: ${modelPath}`);
      }
    } else {
      console.log('✅ Whisper model already exists');
    }

    // Step 4: Verify installation
    const whisperExecutable = path.join(whisperDir, isWindows ? 'main.exe' : 'main');
    if (fs.existsSync(whisperExecutable)) {
      console.log('✅ Whisper.cpp setup completed successfully!');
      console.log(`📍 Executable: ${whisperExecutable}`);
      console.log(`📍 Model: ${modelPath}`);
      console.log('');
      console.log('🎤 You can now use free speech-to-text!');
      console.log('   Start the service: npm start');
      console.log('   Test endpoint: http://localhost:3004/stt');
    } else {
      console.log('❌ Setup incomplete. Whisper executable not found.');
      console.log('');
      console.log('🔧 Manual setup instructions:');
      console.log('   1. Install build tools (make, gcc, or Visual Studio)');
      console.log('   2. cd whisper.cpp && make');
      console.log('   3. Download model from HuggingFace');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('');
    console.log('🔧 Manual setup instructions:');
    console.log('   1. git clone https://github.com/ggerganov/whisper.cpp.git');
    console.log('   2. cd whisper.cpp && make');
    console.log('   3. bash ./models/download-ggml-model.sh base.en');
    console.log(`   4. cp models/ggml-base.en.bin ${modelsDir}/`);
  }
}

// Run setup
setupWhisper();
