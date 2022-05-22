const express = require('express');
const app = express();

const topRouter = require('./routes/top')
const tagsRouter = require('./routes/tags')
const charactersRouter = require('./routes/characters')
const seriesRouter = require('./routes/series')
const artistRouter = require('./routes/artist')

app.use('/', topRouter);
app.use('/tags', tagsRouter);
app.use('/characters', charactersRouter);
app.use('/series', seriesRouter);
app.use('/artist', artistRouter);

module.exports = app;
