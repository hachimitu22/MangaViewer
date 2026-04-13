const MockUserRepository = require('../../../applicationService/__mocks__/MockUserRepository');
const MockMediaQueryRepository = require('../../../applicationService/__mocks__/MockMediaQueryRepository');
const User = require('../../../../../src/domain/user/user');
const UserId = require('../../../../../src/domain/user/userId');
const MediaId = require('../../../../../src/domain/media/mediaId');
const {
  Input,
  GetQueueService,
  InputSortType,
} = require('../../../../../src/application/user/query/GetQueueService');

describe('GetQueueService', () => {
  test('user の queue をページング済み media overview 一覧へ変換して返す', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const user = new User(new UserId('user001'));
    user.addQueue(new MediaId('media-001'));
    user.addQueue(new MediaId('media-002'));
    user.addFavorite(new MediaId('media-001'));

    userRepository.findByUserId.mockResolvedValue(user);
    mediaQueryRepository.findOverviewsByMediaIds.mockResolvedValue([
      { mediaId: 'media-001', title: 'タイトルB', thumbnail: '/c1.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-002', title: 'タイトルA', thumbnail: '/c2.jpg', tags: [], priorityCategories: [] },
    ]);

    const service = new GetQueueService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001', sort: InputSortType.DATE_DESC, queuePage: 1 }));

    expect(userRepository.findByUserId).toHaveBeenCalledWith(new UserId('user001'));
    expect(mediaQueryRepository.findOverviewsByMediaIds).toHaveBeenCalledWith(['media-001', 'media-002']);
    expect(result.sort).toBe(InputSortType.DATE_DESC);
    expect(result.queuePage).toBe(1);
    expect(result.start).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.mediaOverviews).toEqual([
      { mediaId: 'media-001', title: 'タイトルB', thumbnail: '/c1.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-002', title: 'タイトルA', thumbnail: '/c2.jpg', tags: [], priorityCategories: [] },
    ]);
    expect(result.currentPageMediaOverviews).toEqual([
      { mediaId: 'media-001', title: 'タイトルB', thumbnail: '/c1.jpg', tags: [], priorityCategories: [], isFavorite: true, isQueued: true },
      { mediaId: 'media-002', title: 'タイトルA', thumbnail: '/c2.jpg', tags: [], priorityCategories: [], isFavorite: false, isQueued: true },
    ]);
  });


  test('date_asc と date_desc は同一データで逆順になる', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const user = new User(new UserId('user001'));
    ['media-001', 'media-002', 'media-003'].forEach(mediaId => user.addQueue(new MediaId(mediaId)));

    userRepository.findByUserId.mockResolvedValue(user);
    mediaQueryRepository.findOverviewsByMediaIds.mockResolvedValue([
      { mediaId: 'media-001', title: 'タイトルC', thumbnail: '/1.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-002', title: 'タイトルB', thumbnail: '/2.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-003', title: 'タイトルA', thumbnail: '/3.jpg', tags: [], priorityCategories: [] },
    ]);

    const service = new GetQueueService({ userRepository, mediaQueryRepository });
    const dateDescResult = await service.execute(new Input({ userId: 'user001', sort: InputSortType.DATE_DESC, queuePage: 1 }));
    const dateAscResult = await service.execute(new Input({ userId: 'user001', sort: InputSortType.DATE_ASC, queuePage: 1 }));

    const dateDescIds = dateDescResult.currentPageMediaOverviews.map(media => media.mediaId);
    const dateAscIds = dateAscResult.currentPageMediaOverviews.map(media => media.mediaId);

    expect(dateDescIds).toEqual(['media-001', 'media-002', 'media-003']);
    expect(dateAscIds).toEqual(['media-003', 'media-002', 'media-001']);
    expect(dateAscIds).toEqual([...dateDescIds].reverse());
  });

  test('タイトル並び替えと開始位置を指定できる', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const user = new User(new UserId('user001'));
    ['media-001', 'media-002', 'media-003'].forEach(mediaId => user.addQueue(new MediaId(mediaId)));

    userRepository.findByUserId.mockResolvedValue(user);
    mediaQueryRepository.findOverviewsByMediaIds.mockResolvedValue([
      { mediaId: 'media-001', title: 'かきく', thumbnail: '/1.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-002', title: 'さしす', thumbnail: '/2.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-003', title: 'あいう', thumbnail: '/3.jpg', tags: [], priorityCategories: [] },
    ]);

    const service = new GetQueueService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001', sort: InputSortType.TITLE_ASC, start: 2 }));

    expect(result.queuePage).toBe(1);
    expect(result.start).toBe(2);
    expect(result.totalCount).toBe(3);
    expect(result.mediaOverviews).toEqual([
      { mediaId: 'media-001', title: 'かきく', thumbnail: '/1.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-002', title: 'さしす', thumbnail: '/2.jpg', tags: [], priorityCategories: [] },
    ]);
    expect(result.currentPageMediaOverviews).toEqual([
      { mediaId: 'media-001', title: 'かきく', thumbnail: '/1.jpg', tags: [], priorityCategories: [], isFavorite: false, isQueued: true },
      { mediaId: 'media-002', title: 'さしす', thumbnail: '/2.jpg', tags: [], priorityCategories: [], isFavorite: false, isQueued: true },
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
    expect(result.totalCount).toEqual(0);
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
    expect(result.totalCount).toEqual(0);
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
