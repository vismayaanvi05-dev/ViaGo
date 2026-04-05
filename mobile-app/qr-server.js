const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const QRCode = require('qrcode');
const os = require('os');

const app = express();
const PORT = 3000;

// Get network IP
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const networkIP = getNetworkIP();

// Serve static files from /app root to access dashboard HTML
app.use(express.static('/app'));
app.use(express.static(__dirname));
app.use(express.json());

// API endpoint to get QR code data URLs
app.get('/api/qr-codes', async (req, res) => {
  try {
    const customerURL = `exp://${networkIP}:8081`;
    const deliveryURL = `exp://${networkIP}:8082`;
    
    const customerQR = await QRCode.toDataURL(customerURL, { width: 280, margin: 2 });
    const deliveryQR = await QRCode.toDataURL(deliveryURL, { width: 280, margin: 2 });
    
    res.json({
      customer: {
        url: customerURL,
        qr: customerQR
      },
      delivery: {
        url: deliveryURL,
        qr: deliveryQR
      },
      networkIP
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Main route - serve the mobile test dashboard
app.get('/', (req, res) => {
  res.sendFile('/app/mobile-test-dashboard.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'QR Server Running - Both Apps',
    networkIP,
    customerURL: `exp://${networkIP}:8081`,
    deliveryURL: `exp://${networkIP}:8082`
  });
});

// Start Expo server in background for CUSTOMER APP (port 8081)
console.log('🚀 Starting Expo Metro bundler for Customer App on port 8081...');
const customerAppPath = path.join(__dirname);
const customerExpoProcess = spawn('yarn', ['start', '--port', '8081'], {
  cwd: customerAppPath,
  stdio: 'inherit',
  detached: true
});

customerExpoProcess.unref();

// Start Expo server in background for DELIVERY APP (port 8082)
console.log('🚀 Starting Expo Metro bundler for Delivery Partner App on port 8082...');
const deliveryAppPath = path.join(__dirname, '..', 'delivery-app');
const deliveryExpoProcess = spawn('yarn', ['start', '--port', '8082'], {
  cwd: deliveryAppPath,
  stdio: 'inherit',
  detached: true
});

deliveryExpoProcess.unref();

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ QR Code Server running on port ${PORT}`);
  console.log(`📱 Open your preview URL to see the Mobile Test Dashboard!`);
  console.log(`⏳ Wait 30 seconds for both Expo servers to start...`);
  console.log(`📍 Customer App: Port 8081`);
  console.log(`📍 Delivery App: Port 8082`);
  console.log(`📍 Dashboard: ${__dirname}/../mobile-test-dashboard.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});
