const express = require('express');
const app = express();

const top = require('./handlers/top');
const tags = require('./handlers/tags');
const characters = require('./handlers/characters');
const series = require('./handlers/series');
const artist = require('./handlers/artist');

app.use('/', top);
app.use('/tags', tags);
app.use('/characters', characters);
app.use('/series', series);
app.use('/artist', artist);

module.exports = app;
