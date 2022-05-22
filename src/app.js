const express = require('express');
const app = express();

const topRouter = require('./routes/top')
const tagsRouter = require('./routes/tags')

app.use('/', topRouter);
app.use('/tags', tagsRouter);

module.exports = app;
