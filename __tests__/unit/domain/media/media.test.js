const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');

describe('[Domain][Aggregate][Media]', () => {
  const createBaseMedia = (tags = [], priorities = []) => {
    const id = new MediaId(Symbol('id'));
    const title = new MediaTitle('タイトル');
    const contents = [
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ];
    return new Media(id, title, contents, tags, priorities);
  };

  // -------------------------
  // Media.create
  // -------------------------
  describe('Media.create', () => {
    it('メディアの生成に成功する', () => {
      const id = new MediaId(Symbol('id'));
      const title = new MediaTitle('タイトル');
      const contents = [
        { value: 'first' },
        { value: 'second' },
        { value: 'third' },
      ];

      const media = new Media(id, title, contents, [], []);

      expect(media).toBeInstanceOf(Media);
      expect(media.getId()).toBe(id);
      expect(media.getTitle()).toBe(title);
      expect(media.getContents()).toEqual(contents);
      expect(media.getTags()).toEqual([]);
      expect(media.getPriorityCategories()).toEqual([]);
    });

    it('コンテンツが0件のためメディアの生成に失敗する', () => {
      const id = new MediaId(Symbol('id'));
      const title = new MediaTitle('タイトル');

      expect(() => {
        new Media(id, title, [], [], []);
      }).toThrow();
    });

    it('タグを関連付けることができる', () => {
      const tag = new Tag(new Category('カテゴリー'), new Label('ラベル'));

      const media = createBaseMedia([tag], []);

      const tags = media.getTags();
      expect(tags.length).toBe(1);
      expect(tags[0]).toEqual(tag);

      const priorities = media.getPriorityCategories();
      expect(priorities.length).toBe(1);
      expect(priorities[0]).toEqual(tag.getCategory());
    });

    it('同一ではないタグを複数関連付けることができる', () => {
      const tag1 = new Tag(new Category('カテゴリー1'), new Label('ラベル1'));
      const tag2 = new Tag(new Category('カテゴリー2'), new Label('ラベル2'));

      const media = createBaseMedia([tag1, tag2], []);

      const tags = media.getTags();
      expect(tags.length).toBe(2);
      expect(tags[0]).toEqual(tag1);
      expect(tags[1]).toEqual(tag2);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(tag1.getCategory());
      expect(priorities[1]).toEqual(tag2.getCategory());
    });

    it('同一タグを重複して指定した場合は重複分は設定されない', () => {
      const tag1 = new Tag(new Category('カテゴリー'), new Label('ラベル'));
      const tag2 = new Tag(new Category('カテゴリー'), new Label('ラベル'));

      const media = createBaseMedia([tag1, tag2], []);

      const tags = media.getTags();
      expect(tags.length).toBe(1);
      expect(tags[0]).toEqual(tag1);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(tag1.getCategory());
    });

    it('カテゴリー優先度を明示的に設定できる', () => {
      const category1 = new Category('カテゴリー1');
      const category2 = new Category('カテゴリー2');

      const media = createBaseMedia([], [category2, category1]);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(category2);
      expect(priorities[1]).toEqual(category1);
    });

    it('タグの関連付け後にカテゴリー優先度を設定できる', () => {
      const category1 = new Category('カテゴリー1');
      const category2 = new Category('カテゴリー2');
      const tags = [
        new Tag(category1, new Label('ラベル1')),
        new Tag(category2, new Label('ラベル2')),
      ];

      const media = createBaseMedia(tags, [category2, category1]);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(category2);
      expect(priorities[1]).toEqual(category1);
    });

    it('カテゴリー優先度が未指定のカテゴリーはタグの関連付け順を優先度とする', () => {
      const category1 = new Category('カテゴリー1');
      const category2 = new Category('カテゴリー2');
      const tags = [
        new Tag(category1, new Label('ラベル1')),
        new Tag(category2, new Label('ラベル2')),
      ];

      const media = createBaseMedia(tags, [category2]);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(category2);
      expect(priorities[1]).toEqual(category1);
    });
  });

  // -------------------------
  // changeTitle
  // -------------------------
  describe('Media.changeTitle', () => {
    it('タイトルを変更できる', () => {
      const media = createBaseMedia();

      const newTitle = new MediaTitle('新タイトル');
      media.changeTitle(newTitle);

      expect(media.getTitle()).toEqual(newTitle);
    });
  });

  // -------------------------
  // changeContents
  // -------------------------
  describe('Media.changeContents', () => {
    it('コンテンツを変更できる', () => {
      const media = createBaseMedia();

      const newContents = [
        { value: 'second' },
        { value: 'third' },
        { value: 'first' },
      ];
      media.changeContents(newContents);

      expect(media.getContents()).toEqual(newContents);
    });

    it('コンテンツを0件に変更すると失敗する', () => {
      const media = createBaseMedia();

      expect(() => {
        media.changeContents([]);
      }).toThrow();
    });
  });

  // -------------------------
  // changeTags
  // -------------------------
  describe('Media.changeTags', () => {
    it('タグを変更できる', () => {
      const tag1 = new Tag(new Category('カテゴリー1'), new Label('ラベル1'));
      const media = createBaseMedia([tag1], []);

      const tag2 = new Tag(new Category('カテゴリー2'), new Label('ラベル2'));
      media.changeTags([tag2]);

      const tags = media.getTags();
      expect(tags.length).toBe(1);
      expect(tags[0]).toEqual(tag2);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(tag2.getCategory());
    });

    it('同一タグを重複して設定すると重複分は設定されない', () => {
      const media = createBaseMedia();
      const tag1 = new Tag(new Category('カテゴリー'), new Label('ラベル'));
      const tag2 = new Tag(new Category('カテゴリー'), new Label('ラベル'));

      media.changeTags([tag1, tag2]);

      const tags = media.getTags();
      expect(tags.length).toBe(1);
      expect(tags[0]).toEqual(tag1);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(tag1.getCategory());
    });
  });

  // -------------------------
  // changePriorityCategories
  // -------------------------
  describe('Media.changePriorityCategories', () => {
    it('カテゴリー優先度を変更できる', () => {
      const category1 = new Category('カテゴリー1');
      const media = createBaseMedia([], [category1]);

      const category2 = new Category('カテゴリー2');
      media.changePriorityCategories([category2]);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(category2);
    });

    it('同一カテゴリー優先度を重複して設定すると重複分は設定されない', () => {
      const media = createBaseMedia();
      const category1 = new Category('カテゴリー');
      const category2 = new Category('カテゴリー');

      media.changePriorityCategories([category1, category2]);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(category1);
    });
  });
});
