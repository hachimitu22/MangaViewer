const express = require('express');
const app = express();

const topRouter = require('./routes/top')
const tagsRouter = require('./routes/tags')
const charactersRouter = require('./routes/characters')
const seriesRouter = require('./routes/series')

app.use('/', topRouter);
app.use('/tags', tagsRouter);
app.use('/characters', charactersRouter);
app.use('/series', seriesRouter);

module.exports = app;
