const express = require('express');
const top = require('../handlers/top');
const router = express.Router();

router.get('/', top);

module.exports = router;
