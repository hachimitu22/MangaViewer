const express = require('express');
const router = express.Router();

const top = require('./handlers/top');
const login = require('./handlers/login');
const logout = require('./handlers/logout');
const list = require('./handlers/list');
const search = require('./handlers/search');
const view = require('./handlers/view');
const edit = require('./handlers/edit');
const uploadHandlers = require('./handlers/upload');

router.get('/', top);
router.post('/login', login);
router.post('/logout', logout);
router.get('/list', list);
router.get('/search', search);
router.get('/view/:id', view);
router.get('/edit/:id', edit);
router.post('/upload/:id', ...uploadHandlers);

module.exports = router;
