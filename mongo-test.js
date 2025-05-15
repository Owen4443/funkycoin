require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI not found. Make sure it's defined in your .env file.");
  process.exit(1);
}

// Safe, modern MongoDB client setup
const client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: true // For development only
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  } finally {
    await client.close();
  }
}

run();
