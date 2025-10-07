const express = require('express');
const cors = require('cors'); // ✅ add this line

const app = express();

// ✅ enable CORS for all routes
app.use(cors());
app.use(express.json());

app.get('/products', (req, res) => {
  res.json([{ id: 1, name: 'Book', price: 10 }]);
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}

module.exports = app;
