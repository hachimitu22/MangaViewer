const express = require('express');
const router = express.Router();

const top = require('./handlers/top');
const tags = require('./handlers/tags');
const characters = require('./handlers/characters');
const series = require('./handlers/series');
const artists = require('./handlers/artists');

router.get('/', top);
router.get('/tags/', tags);
router.get('/characters/', characters);
router.get('/series/', series);
router.get('/artists/', artists);

module.exports = router;
