const { Sequelize } = require('sequelize');

const SequelizeMediaRepository = require('../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../../../../src/infrastructure/SequelizeMediaQueryRepository');
const SequelizeUserRepository = require('../../../../src/infrastructure/SequelizeUserRepository');
const SequelizeUnitOfWork = require('../../../../src/infrastructure/SequelizeUnitOfWork');
const { GetQueueService, Input: QueueInput } = require('../../../../src/application/user/query/GetQueueService');
const { GetFavoriteSummariesService, Input: FavoriteInput } = require('../../../../src/application/user/query/GetFavoriteSummariesService');
const User = require('../../../../src/domain/user/user');
const UserId = require('../../../../src/domain/user/userId');
const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../src/domain/media/contentId');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');

const createMedia = ({ mediaId, title }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  [new ContentId(`${mediaId}-content-001`)],
  [new Tag(new Category('作者'), new Label('山田'))],
  [new Category('作者')],
);

describe('user query services (middle)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;
  let mediaQueryRepository;
  let userRepository;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    mediaQueryRepository = new SequelizeMediaQueryRepository({ sequelize });
    userRepository = new SequelizeUserRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await mediaRepository.sync();

    const user = new User(new UserId('user001'));
    user.addFavorite(new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
    user.addQueue(new MediaId('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'));

    await unitOfWork.run(async () => {
      await mediaRepository.save(createMedia({ mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', title: 'お気に入り作品' }));
      await mediaRepository.save(createMedia({ mediaId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', title: 'あとで見る作品' }));
      await userRepository.save(user);
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  test('GetQueueService / GetFavoriteSummariesService が実リポジトリから概要一覧を返す', async () => {
    const getQueueService = new GetQueueService({ userRepository, mediaQueryRepository });
    const getFavoriteSummariesService = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });

    const queueResult = await getQueueService.execute(new QueueInput({ userId: 'user001' }));
    const favoriteResult = await getFavoriteSummariesService.execute(new FavoriteInput({ userId: 'user001' }));

    expect(queueResult.mediaOverviews).toEqual([
      expect.objectContaining({ mediaId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', title: 'あとで見る作品' }),
    ]);
    expect(favoriteResult.mediaOverviews).toEqual([
      expect.objectContaining({ mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', title: 'お気に入り作品' }),
    ]);
  });
});
