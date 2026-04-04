const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from /app directory
app.use(express.static('/app'));

// Main route
app.get('/', (req, res) => {
  res.sendFile('/app/mobile-testing-dashboard.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Mobile Testing Dashboard running on http://localhost:${PORT}`);
  console.log(`📱 Open your preview URL to see the dashboard`);
});
