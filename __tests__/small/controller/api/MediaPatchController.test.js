const MediaPatchController = require('../../../../src/controller/api/MediaPatchController');
const {
  UpdateMediaServiceInput,
} = require('../../../../src/application/media/command/UpdateMediaService');

describe('MediaPatchController', () => {
  let updateMediaService;
  let controller;

  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const execute = async ({ params, body, contentIds }) => {
    const req = {
      params,
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
    updateMediaService = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    controller = new MediaPatchController({ updateMediaService });
  });

  it('mediaId・title・tags・contentIdsを使ってメディア更新に成功する', async () => {
    const { res } = await execute({
      params: { mediaId: 'm1' },
      body: {
        title: 'updated',
        tags: [{ category: '作者', label: 'A' }],
      },
      contentIds: ['c2', 'c1'],
    });

    expect(updateMediaService.execute).toHaveBeenCalledTimes(1);
    const input = updateMediaService.execute.mock.calls[0][0];
    expect(input).toBeInstanceOf(UpdateMediaServiceInput);
    expect(input).toMatchObject({
      id: 'm1',
      title: 'updated',
      contents: ['c2', 'c1'],
      tags: [{ category: '作者', label: 'A' }],
      priorityCategories: ['作者'],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 0 });
  });

  it('priorityCategoriesはtags.categoryの出現順で重複なく生成される', async () => {
    await execute({
      params: { mediaId: 'm1' },
      body: {
        title: 'updated',
        tags: [
          { category: '作者', label: 'A' },
          { category: 'ジャンル', label: 'バトル' },
          { category: '作者', label: 'B' },
        ],
      },
      contentIds: ['c1'],
    });

    const input = updateMediaService.execute.mock.calls[0][0];
    expect(input.priorityCategories).toEqual(['作者', 'ジャンル']);
  });

  it('UpdateMediaServiceが失敗した場合は500を返す', async () => {
    updateMediaService.execute.mockRejectedValue(new Error('fail'));

    const { res } = await execute({
      params: { mediaId: 'm1' },
      body: {
        title: 'updated',
        tags: [],
      },
      contentIds: ['c1'],
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });

  it.each([
    ['mediaIdが未設定', {}, { title: 'title', tags: [] }, ['c1']],
    ['mediaIdが空文字', { mediaId: '' }, { title: 'title', tags: [] }, ['c1']],
    ['titleが空文字', { mediaId: 'm1' }, { title: '', tags: [] }, ['c1']],
    ['titleがstring以外', { mediaId: 'm1' }, { title: 1, tags: [] }, ['c1']],
    ['tagsが未設定', { mediaId: 'm1' }, { title: 'title' }, ['c1']],
    ['tagsが配列以外', { mediaId: 'm1' }, { title: 'title', tags: {} }, ['c1']],
    ['tags配列要素がnull', { mediaId: 'm1' }, { title: 'title', tags: [null] }, ['c1']],
    ['tagsのcategoryが空文字', { mediaId: 'm1' }, { title: 'title', tags: [{ category: '', label: 'A' }] }, ['c1']],
    ['tagsのlabelが空文字', { mediaId: 'm1' }, { title: 'title', tags: [{ category: 'A', label: '' }] }, ['c1']],
    ['contentIdsが未設定', { mediaId: 'm1' }, { title: 'title', tags: [] }, undefined],
    ['contentIdsが空配列', { mediaId: 'm1' }, { title: 'title', tags: [] }, []],
    ['contentIdsに重複がある', { mediaId: 'm1' }, { title: 'title', tags: [] }, ['c1', 'c1']],
  ])('%sの場合は400を返す', async (_name, params, body, contentIds) => {
    const { res } = await execute({ params, body, contentIds });

    expect(updateMediaService.execute).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bad Request' });
  });
});
