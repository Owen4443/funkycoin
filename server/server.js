// Load environment variables from the root .env using absolute path
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ✅ Middleware
app.use(helmet()); // Security headers

// ✅ Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true, 
  legacyHeaders: false,
});
app.use(limiter);

// ✅ CORS (allow only your Telegram WebApp domain)
app.use(cors({
  origin: 'https://funkycoin.onrender.com', // Replace if needed
}));

app.use(express.json());

// ✅ Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// ✅ Test Route
app.get('/api', (req, res) => {
  res.send('🚀 FunkyCoin Backend is running');
});

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// ✅ Serve React Frontend in Production
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
