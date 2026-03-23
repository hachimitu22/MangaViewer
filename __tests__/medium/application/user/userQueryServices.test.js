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

const createMedia = ({ mediaId, title, thumbnail, tags, priorityCategories }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  [new ContentId(thumbnail), new ContentId(`${thumbnail}-detail`)],
  tags.map(tag => new Tag(new Category(tag.category), new Label(tag.label))),
  priorityCategories.map(category => new Category(category)),
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
  });

  afterEach(async () => {
    await sequelize.close();
  });

  describe('GetFavoriteSummariesService', () => {
    test('normal: favorite 永続化結果をもとに mediaOverviews が返る', async () => {
      const user = new User(new UserId('user001'));
      user.addFavorite(new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));

      await unitOfWork.run(async () => {
        await mediaRepository.save(createMedia({
          mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          title: 'お気に入り作品',
          thumbnail: 'favorite-thumb',
          tags: [
            { category: 'シリーズ', label: '注目作' },
            { category: '作者', label: '山田' },
          ],
          priorityCategories: ['シリーズ', '作者'],
        }));
        await userRepository.save(user);
      });

      const service = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });
      const result = await service.execute(new FavoriteInput({ userId: 'user001' }));

      expect(result.mediaOverviews).toEqual([
        {
          mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          title: 'お気に入り作品',
          thumbnail: 'favorite-thumb',
          tags: [
            { category: 'シリーズ', label: '注目作' },
            { category: '作者', label: '山田' },
          ],
          priorityCategories: ['シリーズ', '作者'],
        },
      ]);
    });

    test('business: user が存在しない場合は空配列を返す', async () => {
      const service = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });

      await expect(service.execute(new FavoriteInput({ userId: 'missing-user' }))).resolves.toEqual({
        mediaOverviews: [],
      });
    });
  });

  describe('GetQueueService', () => {
    test('normal: SequelizeUserRepository と SequelizeMediaQueryRepository を接続し queue を画面表示用 mediaOverviews へ変換する', async () => {
      const user = new User(new UserId('user001'));
      user.addQueue(new MediaId('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'));

      await unitOfWork.run(async () => {
        await mediaRepository.save(createMedia({
          mediaId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          title: 'あとで見る作品',
          thumbnail: 'queue-thumb',
          tags: [
            { category: '雑誌', label: '月刊テスト' },
            { category: '作者', label: '佐藤' },
          ],
          priorityCategories: ['雑誌', '作者'],
        }));
        await userRepository.save(user);
      });

      const service = new GetQueueService({ userRepository, mediaQueryRepository });
      const result = await service.execute(new QueueInput({ userId: 'user001' }));

      expect(result.mediaOverviews).toEqual([
        {
          mediaId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          title: 'あとで見る作品',
          thumbnail: 'queue-thumb',
          tags: [
            { category: '雑誌', label: '月刊テスト' },
            { category: '作者', label: '佐藤' },
          ],
          priorityCategories: ['雑誌', '作者'],
        },
      ]);
    });

    test('business: queue が 0 件の場合は空配列を返す', async () => {
      await unitOfWork.run(async () => {
        await userRepository.save(new User(new UserId('user001')));
      });

      const service = new GetQueueService({ userRepository, mediaQueryRepository });

      await expect(service.execute(new QueueInput({ userId: 'user001' }))).resolves.toEqual({
        mediaOverviews: [],
      });
    });

    test('technical: 永続化層の例外をそのまま上位へ送出する', async () => {
      const failingUserRepository = {
        findByUserId: jest.fn(async () => {
          throw new Error('database unavailable');
        }),
      };
      const service = new GetQueueService({
        userRepository: failingUserRepository,
        mediaQueryRepository,
      });

      await expect(service.execute(new QueueInput({ userId: 'user001' }))).rejects.toThrow('database unavailable');
    });
  });
});
