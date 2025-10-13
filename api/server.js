const express = require('express');
const cors = require('cors');

const app = express();

// ✅ enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// ✅ default root route
app.get('/', (req, res) => {
  res.send('<h2>Welcome to the E-commerce API 🚀</h2><p>Try <a href="/products">/products</a> or <a href="/health">/health</a></p>');
});

// ✅ sample API route
app.get('/products', (req, res) => {
  res.json([{ id: 1, name: 'Book', price: 10 }]);
});

// ✅ health check (for AWS Elastic Beanstalk)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Backend is healthy 🚀' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}

module.exports = app;
