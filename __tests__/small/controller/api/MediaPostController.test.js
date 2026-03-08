const MediaPostController = require('../../../../src/controller/api/MediaPostController');
const {
  RegisterMediaServiceInput,
} = require('../../../../src/application/media/command/RegisterMediaService');

describe('MediaPostController', () => {
  let registerMediaService;
  let controller;

  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const execute = async ({ body, contentIds }) => {
    const req = {
      body,
      context: {
        contentIds,
      },
    };
    const res = createRes();

    await controller.execute(req, res);

    return { res };
  };

  beforeEach(() => {
    registerMediaService = {
      execute: jest.fn().mockResolvedValue({ mediaId: 'm1' }),
    };

    controller = new MediaPostController({ registerMediaService });
  });

  it('contentIdsを使ってメディア登録に成功する', async () => {
    // arrange

    // action
    const { res } = await execute({
      body: {
        title: 'title',
        tags: [{ category: '作者', label: 'A' }],
      },
      contentIds: ['c1', 'c2'],
    });

    // assert
    expect(registerMediaService.execute).toHaveBeenCalledTimes(1);
    const input = registerMediaService.execute.mock.calls[0][0];
    expect(input).toBeInstanceOf(RegisterMediaServiceInput);
    expect(input).toMatchObject({
      title: 'title',
      contents: ['c1', 'c2'],
      tags: [{ category: '作者', label: 'A' }],
      priorityCategories: ['作者'],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 0,
      mediaId: 'm1',
    });
  });

  it('tagsが空配列でもメディア登録に成功する', async () => {
    // arrange

    // action
    const { res } = await execute({
      body: {
        title: 'title',
        tags: [],
      },
      contentIds: ['c1'],
    });

    // assert
    expect(registerMediaService.execute).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      code: 0,
      mediaId: 'm1',
    });
  });

  it('重複タグを含んでもメディア登録に成功する', async () => {
    // arrange

    // action
    const { res } = await execute({
      body: {
        title: 'title',
        tags: [
          { category: '作者', label: 'A' },
          { category: '作者', label: 'A' },
        ],
      },
      contentIds: ['c1'],
    });

    // assert
    expect(registerMediaService.execute).toHaveBeenCalledTimes(1);
    const input = registerMediaService.execute.mock.calls[0][0];
    expect(input.tags).toMatchObject([
      { category: '作者', label: 'A' },
      { category: '作者', label: 'A' },
    ]);
    expect(input.priorityCategories).toEqual(['作者']);
    expect(res.json).toHaveBeenCalledWith({
      code: 0,
      mediaId: 'm1',
    });
  });

  it('contentIdsの順序を維持して処理される', async () => {
    // arrange

    // action
    await execute({
      body: {
        title: 'title',
        tags: [],
      },
      contentIds: ['c3', 'c1', 'c2'],
    });

    // assert
    const input = registerMediaService.execute.mock.calls[0][0];
    expect(input.contents).toEqual(['c3', 'c1', 'c2']);
  });

  it('priorityCategoriesはtags.categoryの出現順で重複なく生成される', async () => {
    // arrange

    // action
    await execute({
      body: {
        title: 'title',
        tags: [
          { category: '作者', label: 'A' },
          { category: 'ジャンル', label: 'バトル' },
          { category: '作者', label: 'B' },
          { category: 'シリーズ', label: 'X' },
          { category: 'ジャンル', label: 'アクション' },
        ],
      },
      contentIds: ['c1'],
    });

    // assert
    const input = registerMediaService.execute.mock.calls[0][0];
    expect(input.priorityCategories).toEqual(['作者', 'ジャンル', 'シリーズ']);
  });

  it('RegisterMediaServiceが失敗した場合はcode=1を返す', async () => {
    // arrange
    registerMediaService.execute.mockRejectedValue(new Error('fail'));

    // action
    const { res } = await execute({
      body: {
        title: 'title',
        tags: [],
      },
      contentIds: ['c1'],
    });

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 1,
    });
  });

  it.each([
    ['titleが空文字', { title: '', tags: [] }, ['c1']],
    ['titleがstring以外', { title: 1, tags: [] }, ['c1']],
    ['tagsが未設定', { title: 'title' }, ['c1']],
    ['tagsが配列以外', { title: 'title', tags: {} }, ['c1']],
    ['tags配列要素がnull', { title: 'title', tags: [null] }, ['c1']],
    ['tags配列要素がオブジェクト以外', { title: 'title', tags: [1] }, ['c1']],
    ['tags配列が疎配列', (() => { const tags = []; tags[1] = { category: '作者', label: 'A' }; return { title: 'title', tags }; })(), ['c1']],
    ['tagsのcategoryがstring以外', { title: 'title', tags: [{ category: 1, label: 'A' }] }, ['c1']],
    ['tagsのcategoryが空文字', { title: 'title', tags: [{ category: '', label: 'A' }] }, ['c1']],
    ['tagsのlabelがstring以外', { title: 'title', tags: [{ category: 'A', label: 1 }] }, ['c1']],
    ['tagsのlabelが空文字', { title: 'title', tags: [{ category: 'A', label: '' }] }, ['c1']],
    ['contentIdsが未設定', { title: 'title', tags: [] }, undefined],
    ['contentIdsが配列以外', { title: 'title', tags: [] }, {}],
    ['contentIdsが空配列', { title: 'title', tags: [] }, []],
    ['contentIds要素がstring以外', { title: 'title', tags: [] }, [1]],
    ['contentIds要素が空文字', { title: 'title', tags: [] }, ['']],
    ['contentIds配列が疎配列', { title: 'title', tags: [] }, (() => { const ids = []; ids[1] = 'c1'; return ids; })()],
    ['contentIdsに重複がある', { title: 'title', tags: [] }, ['c1', 'c1']],
  ])('%sの場合は登録失敗を返す', async (_name, body, contentIds) => {
    // arrange

    // action
    const { res } = await execute({ body, contentIds });

    // assert
    expect(registerMediaService.execute).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 1,
    });
  });

  it('想定外例外発生時も失敗レスポンス形式を維持する', async () => {
    // arrange
    const req = {
      body: {
        get title() {
          throw new Error('unexpected');
        },
      },
      context: {
        contentIds: ['c1'],
      },
    };
    const res = createRes();

    // action
    await controller.execute(req, res);

    // assert
    expect(registerMediaService.execute).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 1,
    });
  });
});
