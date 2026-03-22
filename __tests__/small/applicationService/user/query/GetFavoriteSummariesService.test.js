const MockUserRepository = require('../../../applicationService/__mocks__/MockUserRepository');
const MockMediaQueryRepository = require('../../../applicationService/__mocks__/MockMediaQueryRepository');
const User = require('../../../../../src/domain/user/user');
const UserId = require('../../../../../src/domain/user/userId');
const MediaId = require('../../../../../src/domain/media/mediaId');
const {
  Input,
  GetFavoriteSummariesService,
} = require('../../../../../src/application/user/query/GetFavoriteSummariesService');

describe('GetFavoriteSummariesService', () => {
  test('user の favorite を media overview 一覧へ変換して返す', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const user = new User(new UserId('user001'));
    user.addFavorite(new MediaId('media-001'));
    user.addFavorite(new MediaId('media-002'));

    userRepository.findByUserId.mockResolvedValue(user);
    mediaQueryRepository.findOverviewsByMediaIds.mockResolvedValue([
      { mediaId: 'media-001', title: 'タイトル1', thumbnail: '/c1.jpg', tags: [], priorityCategories: [] },
      { mediaId: 'media-002', title: 'タイトル2', thumbnail: '/c2.jpg', tags: [], priorityCategories: [] },
    ]);

    const service = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001' }));

    expect(userRepository.findByUserId).toHaveBeenCalledWith(expect.objectContaining({}));
    expect(mediaQueryRepository.findOverviewsByMediaIds).toHaveBeenCalledWith(['media-001', 'media-002']);
    expect(result.mediaOverviews).toHaveLength(2);
  });
});
