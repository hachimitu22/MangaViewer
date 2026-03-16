const express = require('express');
const request = require('supertest');
const multer = require('multer');

const ContentSaveMiddleware = require('../../../../src/controller/middleware/ContentSaveMiddleware');

describe('ContentSaveMiddleware (middle)', () => {
  const createMulterAdapter = () => {
    const upload = multer({ storage: multer.memoryStorage() }).any();

    return {
      execute: (req, res, cb) => {
        upload(req, res, error => {
          if (error) {
            cb(error);
            return;
          }

          const contents = (req.files ?? []).map(file => {
            const matched = file.fieldname.match(/^contents\[(\d+)\]\[file\]$/);
            if (!matched) {
              return null;
            }

            const index = matched[1];
            const positionRaw = req.body?.contents[index].position;
            const urlRaw = req.body?.contents[index].url;
            const position = Number(positionRaw);

            if (!Number.isInteger(position) || position < 1) {
              return null;
            }

            return {
              position,
              contentId: typeof urlRaw === 'string' && urlRaw.length > 0
                ? urlRaw
                : `/mock/${position}/${file.originalname}`,
            };
          }).filter(content => content !== null);

          if (contents.length === 0) {
            req.context = req.context ?? {};
            req.context.contentIds = [];
            cb();
            return;
          }

          const positions = contents.map(content => content.position);
          if (new Set(positions).size !== positions.length) {
            cb(new Error('duplicate position'));
            return;
          }

          contents.sort((a, b) => a.position - b.position);
          req.context = req.context ?? {};
          req.context.contentIds = contents.map(content => content.contentId);
          cb();
        });
      },
    };
  };

  const createApp = ({ adapter }) => {
    const app = express();
    const middleware = new ContentSaveMiddleware({ contentUploadAdapter: adapter });

    app.post('/api/media', middleware.execute.bind(middleware), (_req, res) => {
      res.status(200).json({ code: 0 });
    });

    return app;
  };

  test('contents[n].file / position / url の構造で送信し、position順のcontentIdsで後続へ委譲できる', async () => {
    const app = createApp({ adapter: createMulterAdapter() });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '2')
      .field('contents[0][url]', '/content/2')
      .attach('contents[0][file]', Buffer.from('b'), 'same-name.jpg')
      .field('contents[1][position]', '1')
      .field('contents[1][url]', '/content/1')
      .attach('contents[1][file]', Buffer.from('a'), 'same-name.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0 });
  });

  test('contents が未指定の場合は失敗レスポンスを返す', async () => {
    const app = createApp({ adapter: createMulterAdapter() });

    const response = await request(app)
      .post('/api/media')
      .field('title', 'sample');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });

  test('contents[n].position が重複する場合は失敗レスポンスを返す', async () => {
    const app = createApp({ adapter: createMulterAdapter() });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .field('contents[0][url]', '/content/a')
      .attach('contents[0][file]', Buffer.from('a'), 'same-name.jpg')
      .field('contents[1][position]', '1')
      .field('contents[1][url]', '/content/b')
      .attach('contents[1][file]', Buffer.from('b'), 'same-name.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });
});
