const express = require('express');
const app = express();
const router = require('./router');

app.set('view engine', 'ejs');
app.use('/', router);

module.exports = app;
