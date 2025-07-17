const express = require('express');
const router = express.Router();

const top = require('./handlers/top');
const login = require('./handlers/login');
const logout = require('./handlers/logout');
const list = require('./handlers/list');
const search = require('./handlers/search');
const viewer = require('./handlers/viewer');

router.get('/', top);
router.post('/login', login);
router.post('/logout', logout);
router.get('/list', list);
router.get('/search', search);
router.get('/viewer/:id', viewer);

module.exports = router;
