const MockUserRepository = require('../../../applicationService/__mocks__/MockUserRepository');
const MockMediaQueryRepository = require('../../../applicationService/__mocks__/MockMediaQueryRepository');
const User = require('../../../../../src/domain/user/user');
const UserId = require('../../../../../src/domain/user/userId');
const MediaId = require('../../../../../src/domain/media/mediaId');
const {
  Input,
  Output,
  GetFavoriteSummariesService,
} = require('../../../../../src/application/user/query/GetFavoriteSummariesService');

const createOverview = ({ mediaId, title }) => ({
  mediaId,
  title,
  thumbnail: `/${mediaId}.jpg`,
  tags: [],
  priorityCategories: [],
});

describe('GetFavoriteSummariesService', () => {
  test('user の favorite を media overview 一覧へ変換して返す', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const user = new User(new UserId('user001'));
    user.addFavorite(new MediaId('media-001'));
    user.addFavorite(new MediaId('media-002'));

    userRepository.findByUserId.mockResolvedValue(user);
    mediaQueryRepository.findOverviewsByMediaIds.mockResolvedValue([
      createOverview({ mediaId: 'media-001', title: 'タイトル1' }),
      createOverview({ mediaId: 'media-002', title: 'タイトル2' }),
    ]);

    const service = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001' }));

    expect(userRepository.findByUserId).toHaveBeenCalledWith(expect.objectContaining({}));
    expect(mediaQueryRepository.findOverviewsByMediaIds).toHaveBeenCalledWith(['media-001', 'media-002']);
    expect(result).toEqual(new Output({
      mediaOverviews: [
        createOverview({ mediaId: 'media-002', title: 'タイトル2' }),
        createOverview({ mediaId: 'media-001', title: 'タイトル1' }),
      ],
      totalCount: 2,
    }));
  });

  test('sort=title_asc でタイトル昇順へ並べ替える', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const user = new User(new UserId('user001'));
    user.addFavorite(new MediaId('media-c'));
    user.addFavorite(new MediaId('media-a'));
    user.addFavorite(new MediaId('media-b'));

    userRepository.findByUserId.mockResolvedValue(user);
    mediaQueryRepository.findOverviewsByMediaIds.mockResolvedValue([
      createOverview({ mediaId: 'media-c', title: 'さくら' }),
      createOverview({ mediaId: 'media-a', title: 'あお' }),
      createOverview({ mediaId: 'media-b', title: 'たろう' }),
    ]);

    const service = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001', sort: 'title_asc', page: 1 }));

    expect(result.mediaOverviews.map(media => media.title)).toEqual(['あお', 'さくら', 'たろう']);
    expect(result.totalCount).toBe(3);
  });

  test('page=2 で 21 件目以降だけを返す', async () => {
    const userRepository = new MockUserRepository();
    const mediaQueryRepository = new MockMediaQueryRepository();
    const user = new User(new UserId('user001'));
    const overviews = Array.from({ length: 25 }, (_, index) => {
      const mediaId = `media-${String(index + 1).padStart(3, '0')}`;
      user.addFavorite(new MediaId(mediaId));
      return createOverview({ mediaId, title: `タイトル${index + 1}` });
    });

    userRepository.findByUserId.mockResolvedValue(user);
    mediaQueryRepository.findOverviewsByMediaIds.mockResolvedValue(overviews);

    const service = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });
    const result = await service.execute(new Input({ userId: 'user001', page: 2, sort: 'date_desc' }));

    expect(result.mediaOverviews).toHaveLength(5);
    expect(result.mediaOverviews[0].mediaId).toBe('media-021');
    expect(result.mediaOverviews[4].mediaId).toBe('media-025');
    expect(result.totalCount).toBe(25);
  });
});
