const request = require('supertest');
const app = require('../../src/app');

describe('app', () => {
  it('GET', (done) => {
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
});