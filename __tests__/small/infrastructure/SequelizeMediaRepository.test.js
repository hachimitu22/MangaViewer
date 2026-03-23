const { Sequelize } = require('sequelize');

const SequelizeMediaRepository = require('../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeUnitOfWork = require('../../../src/infrastructure/SequelizeUnitOfWork');
const Media = require('../../../src/domain/media/media');
const MediaId = require('../../../src/domain/media/mediaId');
const MediaTitle = require('../../../src/domain/media/mediaTitle');
const ContentId = require('../../../src/domain/media/contentId');
const Tag = require('../../../src/domain/media/tag');
const Category = require('../../../src/domain/media/category');
const Label = require('../../../src/domain/media/label');

const createMedia = ({
  mediaId = 'media-001',
  title = 'タイトル1',
  contents = ['/a/1.jpg'],
  tags = [{ category: '作者', label: '山田太郎' }],
  priorityCategories = ['作者'],
} = {}) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  contents.map(content => new ContentId(content)),
  tags.map(tag => new Tag(new Category(tag.category), new Label(tag.label))),
  priorityCategories.map(category => new Category(category)),
);

describe('SequelizeMediaRepository', () => {
  test('sync で未指定 models のテーブルを初期化できる', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const repository = new SequelizeMediaRepository({
      sequelize,
      unitOfWorkContext: new SequelizeUnitOfWork({ sequelize }),
    });

    try {
      await repository.sync();
      const tables = await sequelize.getQueryInterface().showAllTables();
      expect(tables).toEqual(expect.arrayContaining([
        'media',
        'content',
        'category',
        'tag',
        'media_tag',
        'media_category',
      ]));
    } finally {
      await sequelize.close();
    }
  });

  test('空の content / tag / priorityCategories を持つ Media も保存して復元できる', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });
    const repository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await repository.sync();

    try {
      const media = createMedia({ contents: ['/a/1.jpg'], tags: [], priorityCategories: [] });
      await repository.save(media);

      const actual = await repository.findByMediaId(new MediaId('media-001'));
      expect(actual.getContents().map(content => content.getId())).toEqual(['/a/1.jpg']);
      expect(actual.getTags()).toEqual([]);
      expect(actual.getPriorityCategories()).toEqual([]);
      expect(actual.getRegisteredAt()).toBeInstanceOf(Date);
    } finally {
      await sequelize.close();
    }
  });

  test('存在しない media_id の findByMediaId は null、delete は例外なく完了する', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });
    const repository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await repository.sync();

    try {
      const missing = createMedia({ mediaId: 'missing-id' });
      await expect(repository.findByMediaId(new MediaId('missing-id'))).resolves.toBeNull();
      await expect(repository.delete(missing)).resolves.toBeUndefined();
    } finally {
      await sequelize.close();
    }
  });

  test('save は既存メディア更新時に古い content / tag / category 関連を置き換える', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });
    const repository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await repository.sync();

    try {
      await repository.save(createMedia({
        contents: ['/a/1.jpg', '/a/2.jpg'],
        tags: [
          { category: '作者', label: '山田太郎' },
          { category: 'ジャンル', label: 'バトル' },
        ],
        priorityCategories: ['作者', 'ジャンル'],
      }));
      await repository.save(createMedia({
        title: '更新後タイトル',
        contents: ['/b/1.jpg'],
        tags: [{ category: 'シリーズ', label: '第1部' }],
        priorityCategories: ['シリーズ'],
      }));

      const actual = await repository.findByMediaId(new MediaId('media-001'));
      expect(actual.getTitle().getTitle()).toBe('更新後タイトル');
      expect(actual.getContents().map(content => content.getId())).toEqual(['/b/1.jpg']);
      expect(actual.getTags().map(tag => ({
        category: tag.getCategory().getValue(),
        label: tag.getLabel().getLabel(),
      }))).toEqual([{ category: 'シリーズ', label: '第1部' }]);
      expect(actual.getPriorityCategories().map(category => category.getValue())).toEqual(['シリーズ']);
    } finally {
      await sequelize.close();
    }
  });

  test.each([
    ['save', repository => repository.save({})],
    ['findByMediaId', repository => repository.findByMediaId('media-001')],
    ['delete', repository => repository.delete({})],
  ])('%s は不正引数で例外を送出する', async (_name, run) => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const repository = new SequelizeMediaRepository({
      sequelize,
      unitOfWorkContext: new SequelizeUnitOfWork({ sequelize }),
    });

    try {
      await repository.sync();
      await expect(run(repository)).rejects.toThrow(Error);
    } finally {
      await sequelize.close();
    }
  });
});
