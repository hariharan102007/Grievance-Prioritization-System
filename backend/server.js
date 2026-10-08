const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
}

const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

connectDB();

// Routes
app.use('/api/officers',    require('./routes/officers'));
app.use('/api/complaints',  require('./routes/complaints'));
app.use('/api',             require('./routes/api'));

app.get('/api/outbound-ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org', {
      signal: AbortSignal.timeout(5000),
    });
    const ip = (await response.text()).trim();

    if (!response.ok || !ip) {
      throw new Error('Unable to determine outbound IP');
    }

    res.json({ ip });
  } catch (error) {
    res.status(500).json({ error: 'Unable to determine outbound IP' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'DSA Grievance Backend v2', status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
