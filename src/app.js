const express = require('express');
const app = express();

const topRouter = require('./routes/top')
const tagsRouter = require('./routes/tags')
const charactersRouter = require('./routes/characters')

app.use('/', topRouter);
app.use('/tags', tagsRouter);
app.use('/characters', charactersRouter);

module.exports = app;
