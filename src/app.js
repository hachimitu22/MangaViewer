const express = require('express');
const app = express();

const topRouter = require('./routes/top')

app.use('/', topRouter);

module.exports = app;
