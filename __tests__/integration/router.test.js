const request = require('supertest');
const express = require('express');
const app = express();
const router = require('../../src/router');

app.set('view engine', 'ejs');
app.use('/', router);

describe('router', () => {
  it('GET / to top page', (done) => {
    request(app)
      .get('/')
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('top');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
  it('GET /artists to artists page', (done) => {
    request(app)
      .get('/artists')
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('artists');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
  it('GET /characters to characters page', (done) => {
    request(app)
      .get('/characters')
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('characters');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
  it('GET /series to top page', (done) => {
    request(app)
      .get('/series')
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('series');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
  it('GET /tags to top page', (done) => {
    request(app)
      .get('/tags')
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('tags');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});