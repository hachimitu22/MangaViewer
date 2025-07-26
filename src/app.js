const express = require('express');
const path = require('path');
const app = express();
const router = require('./router');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.use((req, res, next) => {
  if (req.headers.cookie) {
    const token = req.headers.cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('session_token='));

    if (!token) {
      return res.redirect('/');
    } else if (req.path === '/') {
      return res.redirect('/list');
    }
  }
  next();
});
app.use('/', router);


module.exports = app;
