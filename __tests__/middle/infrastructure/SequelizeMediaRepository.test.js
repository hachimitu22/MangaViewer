const { Sequelize } = require('sequelize');

const SequelizeMediaRepository = require('../../../src/infrastructure/SequelizeMediaRepository');
const Media = require('../../../src/domain/media/media');
const MediaId = require('../../../src/domain/media/mediaId');
const MediaTitle = require('../../../src/domain/media/mediaTitle');
const ContentId = require('../../../src/domain/media/contentId');
const Tag = require('../../../src/domain/media/tag');
const Category = require('../../../src/domain/media/category');
const Label = require('../../../src/domain/media/label');

describe('SequelizeMediaRepository', () => {
  let sequelize;
  let repository;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    repository = new SequelizeMediaRepository({ sequelize });
    await repository.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const createMedia = () => new Media(
    new MediaId('media-001'),
    new MediaTitle('タイトル1'),
    [new ContentId('/a/1.jpg'), new ContentId('/a/2.jpg')],
    [
      new Tag(new Category('作者'), new Label('山田太郎')),
      new Tag(new Category('ジャンル'), new Label('バトル')),
    ],
    [new Category('ジャンル'), new Category('作者')]
  );


  test('media_category は複合PKを持ち、関連のFK制約を付与しない', async () => {
    const mediaCategoryModel = sequelize.models.media_category;

    expect(mediaCategoryModel.rawAttributes.media_id.primaryKey).toBe(true);
    expect(mediaCategoryModel.rawAttributes.category_id.primaryKey).toBe(true);
    expect(mediaCategoryModel.rawAttributes.priority.primaryKey).toBe(true);
    expect(mediaCategoryModel.associations.media.options.constraints).toBe(false);
    expect(mediaCategoryModel.associations.category.options.constraints).toBe(false);
  });

  test('save で Media 集約を永続化できる', async () => {
    const media = createMedia();

    await repository.save(media);

    const actual = await repository.findByMediaId(new MediaId('media-001'));

    expect(actual).toBeInstanceOf(Media);
    expect(actual.getTitle().getTitle()).toBe('タイトル1');
    expect(actual.getContents().map(c => c.getId())).toEqual(['/a/1.jpg', '/a/2.jpg']);
    const actualTags = actual.getTags().map(t => ({
      category: t.getCategory().getValue(),
      label: t.getLabel().getLabel(),
    }));

    expect(actualTags).toHaveLength(2);
    expect(actualTags).toEqual(expect.arrayContaining([
      { category: '作者', label: '山田太郎' },
      { category: 'ジャンル', label: 'バトル' },
    ]));
  });

  test('findByMediaId は未登録IDで null を返す', async () => {
    const actual = await repository.findByMediaId(new MediaId('not-exists'));

    expect(actual).toBeNull();
  });

  test('delete で対象メディアを削除できる', async () => {
    const media = createMedia();
    await repository.save(media);

    await repository.delete(media);

    const actual = await repository.findByMediaId(new MediaId('media-001'));
    expect(actual).toBeNull();
  });

  test('save は既存メディアを上書きできる', async () => {
    const media = createMedia();
    await repository.save(media);

    const updated = new Media(
      new MediaId('media-001'),
      new MediaTitle('タイトル2'),
      [new ContentId('/b/1.jpg')],
      [new Tag(new Category('シリーズ'), new Label('第一部'))],
      [new Category('シリーズ')]
    );

    await repository.save(updated);

    const actual = await repository.findByMediaId(new MediaId('media-001'));
    expect(actual.getTitle().getTitle()).toBe('タイトル2');
    expect(actual.getContents().map(c => c.getId())).toEqual(['/b/1.jpg']);
    expect(actual.getTags().map(t => ({
      category: t.getCategory().getValue(),
      label: t.getLabel().getLabel(),
    }))).toEqual([{ category: 'シリーズ', label: '第一部' }]);
  });




  test('外部トランザクションを受け取り rollback できる', async () => {
    const media = createMedia();
    const transaction = await sequelize.transaction();

    await repository.save(media, transaction);

    const inTransaction = await repository.findByMediaId(new MediaId('media-001'), transaction);
    expect(inTransaction).toBeInstanceOf(Media);

    await transaction.rollback();

    const actual = await repository.findByMediaId(new MediaId('media-001'));
    expect(actual).toBeNull();
  });

  test('save は Media 以外を受け取ると例外を送出する', async () => {
    await expect(repository.save({})).rejects.toThrow(Error);
  });

  test('findByMediaId は MediaId 以外を受け取ると例外を送出する', async () => {
    await expect(repository.findByMediaId('media-001')).rejects.toThrow(Error);
  });

  test('delete は Media 以外を受け取ると例外を送出する', async () => {
    await expect(repository.delete({})).rejects.toThrow(Error);
  });

  test('タグに存在しない priorityCategories も保存・復元できる', async () => {
    const media = new Media(
      new MediaId('media-002'),
      new MediaTitle('タイトル3'),
      [new ContentId('/c/1.jpg')],
      [new Tag(new Category('作者'), new Label('田中花子'))],
      [new Category('ジャンル'), new Category('作者')]
    );

    await repository.save(media);

    const actual = await repository.findByMediaId(new MediaId('media-002'));

    expect(actual.getTags().map(t => ({
      category: t.getCategory().getValue(),
      label: t.getLabel().getLabel(),
    }))).toEqual([{ category: '作者', label: '田中花子' }]);

    expect(actual.getPriorityCategories().map(c => c.getValue())).toEqual(['ジャンル', '作者']);
  });
});
