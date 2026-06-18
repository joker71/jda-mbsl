
const express = require('express');
const app = express();
app.use(express.json());

// Load Routes...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('OrderService running on port ' + PORT));
  