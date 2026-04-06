const { Sequelize } = require('sequelize');

const SequelizeMediaRepository = require('../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../../../src/infrastructure/SequelizeMediaQueryRepository');
const SequelizeUnitOfWork = require('../../../src/infrastructure/SequelizeUnitOfWork');
const Media = require('../../../src/domain/media/media');
const MediaId = require('../../../src/domain/media/mediaId');
const MediaTitle = require('../../../src/domain/media/mediaTitle');
const ContentId = require('../../../src/domain/media/contentId');
const Tag = require('../../../src/domain/media/tag');
const Category = require('../../../src/domain/media/category');
const Label = require('../../../src/domain/media/label');
const { SearchCondition, SearchConditionTag, SortType } = require('../../../src/application/media/port/SearchCondition');

const createMedia = ({ mediaId, title, contents = ['/contents/default.jpg'], tags = [], priorityCategories = [] }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  contents.map(content => new ContentId(content)),
  tags.map(tag => new Tag(new Category(tag.category), new Label(tag.label))),
  priorityCategories.map(category => new Category(category)),
);

describe('SequelizeMediaQueryRepository', () => {
  test('search は未指定 models でも空データから SearchResult を返す', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const mediaRepository = new SequelizeMediaRepository({
      sequelize,
      unitOfWorkContext: new SequelizeUnitOfWork({ sequelize }),
    });
    const queryRepository = new SequelizeMediaQueryRepository({ sequelize });

    try {
      await mediaRepository.sync();
      const result = await queryRepository.search(new SearchCondition({
        title: '',
        tags: [],
        sortType: SortType.TITLE_ASC,
        start: 1,
        size: 20,
      }));

      expect(result.totalCount).toBe(0);
      expect(result.mediaOverviews).toEqual([]);
    } finally {
      await sequelize.close();
    }
  });

  test('存在しないタグ条件の search は空配列と totalCount 0 を返す', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });
    const mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    const queryRepository = new SequelizeMediaQueryRepository({ sequelize });

    try {
      await mediaRepository.sync();
      await mediaRepository.save(createMedia({
        mediaId: 'media-001',
        title: '山田太郎の冒険',
        contents: ['/contents/a-1.jpg'],
        tags: [{ category: '作者', label: '山田太郎' }],
        priorityCategories: ['作者'],
      }));

      const result = await queryRepository.search(new SearchCondition({
        title: '',
        tags: [new SearchConditionTag({ category: 'ジャンル', label: 'ホラー' })],
        sortType: SortType.TITLE_ASC,
        start: 1,
        size: 20,
      }));

      expect(result.totalCount).toBe(0);
      expect(result.mediaOverviews).toEqual([]);
    } finally {
      await sequelize.close();
    }
  });

  test('findOverviewsByMediaIds は存在しない ID を無視し先頭コンテンツと優先順タグ整列を返す', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });
    const mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    const queryRepository = new SequelizeMediaQueryRepository({ sequelize });

    try {
      await mediaRepository.sync();
      await mediaRepository.save(createMedia({
        mediaId: 'media-001',
        title: '作品A',
        tags: [
          { category: 'ジャンル', label: 'バトル' },
          { category: '作者', label: '山田太郎' },
        ],
        priorityCategories: ['作者', 'ジャンル'],
      }));

      const result = await queryRepository.findOverviewsByMediaIds(['missing-id', 'media-001']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        mediaId: 'media-001',
        title: '作品A',
        thumbnail: '/contents/default.jpg',
        priorityCategories: ['作者', 'ジャンル'],
      }));
      expect(result[0].tags.map(tag => `${tag.category}:${tag.label}`)).toEqual([
        '作者:山田太郎',
        'ジャンル:バトル',
      ]);
    } finally {
      await sequelize.close();
    }
  });

  test('search は DATE_ASC で古い登録順、DATE_DESC で新しい登録順を返す', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });
    const mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    const queryRepository = new SequelizeMediaQueryRepository({ sequelize });

    try {
      await mediaRepository.sync();
      await mediaRepository.save(createMedia({ mediaId: 'media-001', title: '作品1' }));
      await mediaRepository.save(createMedia({ mediaId: 'media-002', title: '作品2' }));
      await mediaRepository.save(createMedia({ mediaId: 'media-003', title: '作品3' }));

      const ascResult = await queryRepository.search(new SearchCondition({
        title: '',
        tags: [],
        sortType: SortType.DATE_ASC,
        start: 1,
        size: 10,
      }));
      expect(ascResult.mediaOverviews.map(overview => overview.mediaId)).toEqual([
        'media-001',
        'media-002',
        'media-003',
      ]);

      const descResult = await queryRepository.search(new SearchCondition({
        title: '',
        tags: [],
        sortType: SortType.DATE_DESC,
        start: 1,
        size: 10,
      }));
      expect(descResult.mediaOverviews.map(overview => overview.mediaId)).toEqual([
        'media-003',
        'media-002',
        'media-001',
      ]);
    } finally {
      await sequelize.close();
    }
  });

  test.each([
    ['search', repository => repository.search({})],
    ['findOverviewsByMediaIds に配列以外', repository => repository.findOverviewsByMediaIds('media-001')],
    ['findOverviewsByMediaIds に不正ID要素', repository => repository.findOverviewsByMediaIds(['media-001', {}])],
  ])('%s は不正入力で例外を送出する', async (_name, run) => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const repository = new SequelizeMediaQueryRepository({ sequelize });

    try {
      await expect(run(repository)).rejects.toThrow(Error);
    } finally {
      await sequelize.close();
    }
  });
});
