const MediaDeleteController = require('../../../../src/controller/api/MediaDeleteController');
const {
  DeleteMediaServiceInput,
} = require('../../../../src/application/media/command/DeleteMediaService');

describe('MediaDeleteController', () => {
  let deleteMediaService;
  let controller;

  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const execute = async params => {
    const req = { params };
    const res = createRes();

    await controller.execute(req, res);

    return { res };
  };

  beforeEach(() => {
    deleteMediaService = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    controller = new MediaDeleteController({ deleteMediaService });
  });

  it('mediaId を使ってメディア削除に成功する', async () => {
    const { res } = await execute({ mediaId: 'm1' });

    expect(deleteMediaService.execute).toHaveBeenCalledTimes(1);
    const input = deleteMediaService.execute.mock.calls[0][0];
    expect(input).toBeInstanceOf(DeleteMediaServiceInput);
    expect(input).toMatchObject({ id: 'm1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 0 });
  });

  it('DeleteMediaService が失敗した場合は code=1 を返す', async () => {
    deleteMediaService.execute.mockRejectedValue(new Error('fail'));

    const { res } = await execute({ mediaId: 'm1' });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it.each([
    ['mediaIdが未設定', {}],
    ['mediaIdが空文字', { mediaId: '' }],
  ])('%sの場合は削除失敗を返す', async (_name, params) => {
    const { res } = await execute(params);

    expect(deleteMediaService.execute).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });
});
