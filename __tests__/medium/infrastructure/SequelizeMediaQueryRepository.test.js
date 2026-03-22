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

const createMedia = ({ mediaId, title, contents, tags, priorityCategories }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  contents.map(content => new ContentId(content)),
  tags.map(tag => new Tag(new Category(tag.category), new Label(tag.label))),
  priorityCategories.map(category => new Category(category))
);

describe('SequelizeMediaQueryRepository', () => {
  let sequelize;
  let mediaRepository;
  let queryRepository;
  let unitOfWork;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    queryRepository = new SequelizeMediaQueryRepository({ sequelize });
    await mediaRepository.sync();

    await mediaRepository.save(createMedia({
      mediaId: 'media-001',
      title: '山田太郎の冒険',
      contents: ['/contents/a-1.jpg', '/contents/a-2.jpg'],
      tags: [
        { category: '作者', label: '山田太郎' },
        { category: 'ジャンル', label: 'バトル' },
      ],
      priorityCategories: ['作者', 'ジャンル'],
    }));

    await mediaRepository.save(createMedia({
      mediaId: 'media-002',
      title: '佐藤花子の日常',
      contents: ['/contents/b-1.jpg'],
      tags: [
        { category: '作者', label: '佐藤花子' },
        { category: 'ジャンル', label: '日常' },
      ],
      priorityCategories: ['ジャンル', '作者'],
    }));
  });

  afterEach(async () => {
    await sequelize.close();
  });

  test('search は一覧表示に必要な概要情報と totalCount を返す', async () => {
    const result = await queryRepository.search(new SearchCondition({
      title: '山田',
      tags: [new SearchConditionTag({ category: 'ジャンル', label: 'バトル' })],
      sortType: SortType.TITLE_ASC,
      start: 1,
      size: 20,
    }));

    expect(result.totalCount).toBe(1);
    expect(result.mediaOverviews).toEqual([
      expect.objectContaining({
        mediaId: 'media-001',
        title: '山田太郎の冒険',
        thumbnail: '/contents/a-1.jpg',
        priorityCategories: ['作者', 'ジャンル'],
        tags: [
          expect.objectContaining({ category: '作者', label: '山田太郎' }),
          expect.objectContaining({ category: 'ジャンル', label: 'バトル' }),
        ],
      }),
    ]);
  });
});
