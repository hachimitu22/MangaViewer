const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');

describe('[Domain][Aggregate][Media]', () => {
  it('メディアの生成に成功する', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];

    // act
    const media = new Media(id, title, contents);

    // assert
    expect(media).toBeInstanceOf(Media);
    expect(media.getId()).toBe(id);
    expect(media.getTitle()).toBe(title);
    expect(media.getContents()).toEqual(contents);
  });

  it('コンテンツが0件のためメディアの生成に失敗する', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [];

    // act
    // assert
    expect(() => {
      new Media(id, title, contents);
    }).toThrow();
  });

  it('コンテンツの順序はメディアが管理する', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents1 = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];
    const media = new Media(id, title, contents1);

    // act
    const contents2 = [
      { value: 'second' },
      { value: 'third' },
      { value: 'first' },
    ];
    media.setContents(contents2)

    // assert
    expect(media.getContents()).toEqual(contents2);
  });

  it('タグを関連付けることができる', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];
    const media = new Media(id, title, contents);
    const tag = new Tag(new Category('カテゴリー'), new Label('ラベル'));

    // act
    media.addTag(tag);

    // assert
    const tags = media.getTags();
    expect(tags.length).toBe(1);
    expect(tags[0]).toEqual(tag);
    const priorities = media.getPriorityCategories();
    expect(priorities.length).toBe(1);
    expect(priorities[0]).toEqual(tag.getCategory());
  });

  it('同一ではないタグを複数関連付けることができる', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];
    const media = new Media(id, title, contents);
    const tag1 = new Tag(new Category('カテゴリー1'), new Label('ラベル1'));
    media.addTag(tag1);

    // act
    const tag2 = new Tag(new Category('カテゴリー2'), new Label('ラベル2'));
    media.addTag(tag2);

    // assert
    const tags = media.getTags();
    expect(tags.length).toBe(2);
    expect(tags[0]).toEqual(tag1);
    expect(tags[1]).toEqual(tag2);
    const priorities = media.getPriorityCategories();
    expect(priorities.length).toBe(2);
    expect(priorities[0]).toEqual(tag1.getCategory());
    expect(priorities[1]).toEqual(tag2.getCategory());
  });

  it('同一タグを重複して関連付けることはできない', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];
    const media = new Media(id, title, contents);
    const tag1 = new Tag(new Category('カテゴリー'), new Label('ラベル'));
    media.addTag(tag1);

    const tag2 = new Tag(new Category('カテゴリー'), new Label('ラベル'));

    // act
    // assert
    expect(() => {
      media.addTag(tag2);
    }).toThrow();
    // タグ状態
    const tags = media.getTags();
    expect(tags.length).toBe(1);
    expect(tags[0]).toEqual(tag1);
    // カテゴリー優先度状態
    const priorities = media.getPriorityCategories();
    expect(priorities.length).toBe(1);
    expect(priorities[0]).toEqual(tag1.getCategory());
  });

  it('カテゴリー優先度を明示的に設定できる', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];
    const media = new Media(id, title, contents);
    const category1 = new Category('カテゴリー1');
    const category2 = new Category('カテゴリー2');

    // act
    media.setPriorityCategories([
      category2,
      category1,
    ]);

    // assert
    const priorities = media.getPriorityCategories();
    expect(priorities.length).toBe(2);
    expect(priorities[0]).toEqual(category2);
    expect(priorities[1]).toEqual(category1);
  });

  it('タグの関連付け後にカテゴリー優先度を設定できる', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];
    const media = new Media(id, title, contents);
    const category1 = new Category('カテゴリー1');
    const category2 = new Category('カテゴリー2');
    const tag1 = new Tag(category1, new Label('ラベル1'));
    const tag2 = new Tag(category2, new Label('ラベル2'));
    media.addTag(tag1);
    media.addTag(tag2);

    // act
    media.setPriorityCategories([
      category2,
      category1,
    ]);

    // assert
    const priorities = media.getPriorityCategories();
    expect(priorities.length).toBe(2);
    expect(priorities[0]).toEqual(category2);
    expect(priorities[1]).toEqual(category1);
  });

  it('カテゴリー優先度が未指定のカテゴリーはタグの関連付け順を優先度とする', () => {
    // arrange
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];
    const media = new Media(id, title, contents);
    const category1 = new Category('カテゴリー1');
    const category2 = new Category('カテゴリー2');
    const tag1 = new Tag(category1, new Label('ラベル1'));
    const tag2 = new Tag(category2, new Label('ラベル2'));
    media.addTag(tag1);
    media.addTag(tag2);

    // act
    media.setPriorityCategories([
      category2,
    ]);

    // assert
    const priorities = media.getPriorityCategories();
    expect(priorities.length).toBe(2);
    expect(priorities[0]).toEqual(category2);
    expect(priorities[1]).toEqual(category1);
  });
});
