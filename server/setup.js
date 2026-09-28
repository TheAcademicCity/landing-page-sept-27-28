#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up School Story Makers Server...\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from env.example');
  } else {
    // Create basic .env file
    const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# Client Configuration
CLIENT_URL=http://localhost:5173

# Google Tag Manager Configuration
GTM_ID=GTM-579PCB3X
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with default configuration');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n🎉 Server setup complete!');
console.log('\nTo start the server:');
console.log('  npm run dev    # Development mode');
console.log('  npm start      # Production mode');
console.log('\nServer will be available at: http://localhost:3001');
console.log('Health check: http://localhost:3001/health');
