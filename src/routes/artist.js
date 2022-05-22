const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('artist');
});

module.exports = router;
