const ContentSaveMiddleware = require('../../../../src/controller/middleware/ContentSaveMiddleware');

describe('ContentSaveMiddleware', () => {
  let contentUploadAdapter;
  let middleware;

  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const createReq = () => ({
    context: {
      contentIds: ['c1', 'c2'],
    },
  });

  const execute = async ({ req, next }) => {
    const targetReq = req ?? createReq();
    const res = createRes();
    const targetNext = next ?? jest.fn();

    await middleware.execute(targetReq, res, targetNext);

    return {
      req: targetReq,
      res,
      next: targetNext,
    };
  };

  beforeEach(() => {
    contentUploadAdapter = {
      execute: jest.fn((_req, _res, cb) => cb()),
    };

    middleware = new ContentSaveMiddleware({ contentUploadAdapter });
  });

  it('uploadAdapter成功かつcontentIds正常時は後続へ委譲する', async () => {
    const { req, res, next } = await execute({});

    expect(contentUploadAdapter.execute).toHaveBeenCalledTimes(1);
    expect(contentUploadAdapter.execute).toHaveBeenCalledWith(req, res, expect.any(Function));
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    ['contextが未設定', {}],
    ['contentIdsが未設定', { context: {} }],
    ['contentIdsが配列以外', { context: { contentIds: 'c1' } }],
    ['contentIdsが空配列', { context: { contentIds: [] } }],
    ['contentIdsに空文字が含まれる', { context: { contentIds: ['c1', ''] } }],
    ['contentIdsに重複がある', { context: { contentIds: ['c1', 'c1'] } }],
  ])('%s場合は失敗レスポンスを返し後続へ委譲しない', async (_name, req) => {
    const { res, next } = await execute({ req });

    expect(contentUploadAdapter.execute).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it('uploadAdapterがエラーを返した場合は失敗レスポンスを返し後続へ委譲しない', async () => {
    contentUploadAdapter.execute.mockImplementationOnce((_req, _res, cb) => cb(new Error('upload failed')));

    const { res, next } = await execute({});

    expect(contentUploadAdapter.execute).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });
});
