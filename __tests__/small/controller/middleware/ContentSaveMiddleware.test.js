const ContentSaveMiddleware = require('../../../../src/controller/middleware/ContentSaveMiddleware');

describe('ContentSaveMiddleware', () => {
  let contentStorage;
  let middleware;

  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const createReq = contents => ({
    body: {
      contents,
    },
    context: {},
  });

  const execute = async ({ contents, req, next }) => {
    const targetReq = req ?? createReq(contents);
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
    contentStorage = {
      save: jest.fn().mockImplementation(async contents => contents.map((_, index) => `c${index + 1}`)),
    };

    middleware = new ContentSaveMiddleware({ contentStorage });
  });

  it('contentsをposition昇順で保存しcontentIdsを設定して委譲する', async () => {
    const contents = [
      { file: { name: '2.png' }, position: 2 },
      { file: { name: '1.png' }, position: 1 },
      { file: { name: '3.png' }, position: 3 },
    ];

    const { req, res, next } = await execute({ contents });

    expect(contentStorage.save).toHaveBeenCalledTimes(1);
    expect(contentStorage.save).toHaveBeenCalledWith([
      { file: { name: '1.png' }, position: 1 },
      { file: { name: '2.png' }, position: 2 },
      { file: { name: '3.png' }, position: 3 },
    ]);
    expect(req.context.contentIds).toEqual(['c1', 'c2', 'c3']);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    ['contentsが未指定', undefined],
    ['contentsが配列以外', {}],
    ['contentsが空配列', []],
    ['contents要素がnull', [null]],
    ['contents要素がオブジェクト以外', ['invalid']],
    ['fileが未指定', [{ position: 1 }]],
    ['fileがnull', [{ file: null, position: 1 }]],
    ['fileが空文字', [{ file: '', position: 1 }]],
    ['fileが空配列', [{ file: [], position: 1 }]],
    ['positionが小数', [{ file: { name: '1.png' }, position: 1.1 }]],
    ['positionが文字列', [{ file: { name: '1.png' }, position: '1' }]],
    ['positionがnull', [{ file: { name: '1.png' }, position: null }]],
    ['positionに重複がある', [{ file: { name: '1.png' }, position: 1 }, { file: { name: '2.png' }, position: 1 }]],
    ['positionに欠番がある', [{ file: { name: '1.png' }, position: 1 }, { file: { name: '3.png' }, position: 3 }]],
    ['positionが1始まりでない', [{ file: { name: '2.png' }, position: 2 }, { file: { name: '3.png' }, position: 3 }]],
  ])('%s場合は失敗レスポンスを返し後続へ委譲しない', async (_name, contents) => {
    const { req, res, next } = await execute({ contents });

    expect(contentStorage.save).not.toHaveBeenCalled();
    expect(req.context.contentIds).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it('保存処理失敗時は失敗レスポンスを返し後続へ委譲しない', async () => {
    contentStorage.save.mockRejectedValue(new Error('save failed'));

    const { req, res, next } = await execute({
      contents: [{ file: { name: '1.png' }, position: 1 }],
    });

    expect(contentStorage.save).toHaveBeenCalledTimes(1);
    expect(req.context.contentIds).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it('req.contextが未初期化でもcontentIdsを設定できる', async () => {
    const req = {
      body: {
        contents: [{ file: { name: '1.png' }, position: 1 }],
      },
    };

    const { next } = await execute({ req });

    expect(req.context.contentIds).toEqual(['c1']);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
