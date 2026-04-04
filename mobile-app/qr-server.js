const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// Main route - show QR code page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'qr-server.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'QR Server Running' });
});

// Start Expo server in background
console.log('🚀 Starting Expo Metro bundler...');
const expoProcess = spawn('yarn', ['start'], {
  cwd: __dirname,
  stdio: 'inherit',
  detached: true
});

expoProcess.unref();

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ QR Code Server running on port ${PORT}`);
  console.log(`📱 Open your preview URL to see the QR code!`);
  console.log(`⏳ Wait 20 seconds for Expo to start...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});
