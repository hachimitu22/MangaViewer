const MockUserRepository = require('../../../applicationService/__mocks__/MockUserRepository');
const MockMediaQueryRepository = require('../../../applicationService/__mocks__/MockMediaQueryRepository');
const User = require('../../../../../src/domain/user/user');
const UserId = require('../../../../../src/domain/user/userId');
const MediaId = require('../../../../../src/domain/media/mediaId');
const {
  Input,
  GetQueueService,
} = require('../../../../../src/application/user/query/GetQueueService');

describe('GetQueueService', () => {
  test('user の queue を media overview 一覧へ変換して返す', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const user = new User(new UserId('user001'));
    user.addQueue(new MediaId('media-001'));
    user.addQueue(new MediaId('media-002'));

    userRepository.findByUserId.mockResolvedValue(user);
    mediaQueryRepository.findOverviewsByMediaIds.mockResolvedValue([
      { mediaId: 'media-001', title: 'タイトル1', thumbnail: '/c1.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-002', title: 'タイトル2', thumbnail: '/c2.jpg', tags: [], priorityCategories: [] },
    ]);

    const service = new GetQueueService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001' }));

    expect(userRepository.findByUserId).toHaveBeenCalledWith(new UserId('user001'));
    expect(mediaQueryRepository.findOverviewsByMediaIds).toHaveBeenCalledWith(['media-001', 'media-002']);
    expect(result.mediaOverviews).toEqual([
      { mediaId: 'media-001', title: 'タイトル1', thumbnail: '/c1.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-002', title: 'タイトル2', thumbnail: '/c2.jpg', tags: [], priorityCategories: [] },
    ]);
  });

  test('queue が空のときは空配列を返す', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();

    userRepository.findByUserId.mockResolvedValue(new User(new UserId('user001')));

    const service = new GetQueueService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001' }));

    expect(userRepository.findByUserId).toHaveBeenCalledWith(new UserId('user001'));
    expect(mediaQueryRepository.findOverviewsByMediaIds).not.toHaveBeenCalled();
    expect(result.mediaOverviews).toEqual([]);
  });

  test('user が存在しないときは空配列を返す', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();

    userRepository.findByUserId.mockResolvedValue(null);

    const service = new GetQueueService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001' }));

    expect(userRepository.findByUserId).toHaveBeenCalledWith(new UserId('user001'));
    expect(mediaQueryRepository.findOverviewsByMediaIds).not.toHaveBeenCalled();
    expect(result.mediaOverviews).toEqual([]);
  });

  test('リポジトリ例外をそのまま伝播する', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const error = new Error('failed');

    userRepository.findByUserId.mockRejectedValue(error);

    const service = new GetQueueService({ userRepository, mediaQueryRepository });

    await expect(service.execute(new Input({ userId: 'user001' }))).rejects.toThrow(error);
    expect(mediaQueryRepository.findOverviewsByMediaIds).not.toHaveBeenCalled();
  });
});
