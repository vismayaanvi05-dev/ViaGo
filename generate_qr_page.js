const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Simple QR display page
app.get('/', async (req, res) => {
  const appType = req.query.app || 'delivery';
  const appName = appType === 'delivery' ? 'Delivery Partner' : 'Customer';
  const expUrl = `exp://127.0.0.1:8081`;
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(expUrl, {
      width: 300,
      margin: 2,
    });
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>HyperServe ${appName} App - QR Code</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            text-align: center;
        }
        h1 {
            color: #8B5CF6;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #6B7280;
            margin-bottom: 30px;
        }
        .qr-container {
            background: #F9FAFB;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            display: inline-block;
        }
        .qr-code {
            width: 300px;
            height: 300px;
        }
        .success-badge {
            background: #10B981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .instructions {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 12px;
            text-align: left;
            margin-top: 20px;
        }
        .instructions h3 {
            color: #1F2937;
            margin-bottom: 15px;
            font-size: 16px;
        }
        .instructions ol {
            padding-left: 20px;
            line-height: 1.8;
            color: #4B5563;
        }
        .expo-url {
            background: #1F2937;
            color: #10B981;
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            margin-top: 15px;
            word-break: break-all;
        }
        .app-badge {
            background: #EC4899;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 HyperServe ${appName} App</h1>
        <p class="subtitle">Scan QR Code to Test on Your Phone</p>
        
        <div class="success-badge">✅ Expo Server Running</div>
        <div class="app-badge">${appType.toUpperCase()} APP</div>
        
        <div class="qr-container">
            <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code" />
        </div>
        
        <div class="expo-url">${expUrl}</div>
        
        <div class="instructions">
            <h3>📱 How to Use:</h3>
            <ol>
                <li>Install <strong>"Expo Go"</strong> app on your phone (App Store or Play Store)</li>
                <li>Open the Expo Go app</li>
                <li><strong>Scan the QR code above</strong> with the app</li>
                <li>Wait 30-60 seconds for the app to load</li>
                <li>Start testing! 🎉</li>
            </ol>
        </div>
    </div>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send(`
      <html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: red;">❌ Error Generating QR Code</h1>
        <p>${error.message}</p>
      </body></html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ QR Code Server running on http://localhost:${PORT}`);
  console.log(`📱 Delivery App: http://localhost:${PORT}/?app=delivery`);
  console.log(`📱 Customer App: http://localhost:${PORT}/?app=customer`);
});
