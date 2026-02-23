const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../src/domain/media/contentId');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');
const FoundContent = require('../../../../src/domain/media/foundContent');
const NotFoundContent = require('../../../../src/domain/media/notFoundContent');

describe('[Domain][Aggregate][Media]', () => {
  // -------------------------
  // Media.create
  // -------------------------
  describe('Media.create', () => {
    it('メディアの生成に成功する', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];

      // action
      const media = new Media(id, title, contents, [], []);

      // assert
      expect(media).toBeInstanceOf(Media);
      expect(media.getId()).toBe(id);
      expect(media.getTitle()).toBe(title);
      expect(media.getContents()).toEqual(contents);
      expect(media.getTags()).toEqual([]);
      expect(media.getPriorityCategories()).toEqual([]);
    });

    it('コンテンツが0件のためメディアの生成に失敗する', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [];

      // action
      // assert
      expect(() => {
        new Media(id, title, contents, [], []);
      }).toThrow();
    });

    it('タグを関連付けることができる', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const tag = new Tag(new Category('カテゴリー'), new Label('ラベル'));

      // action
      const media = new Media(id, title, contents, [tag], []);

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
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const tag1 = new Tag(new Category('カテゴリー1'), new Label('ラベル1'));
      const tag2 = new Tag(new Category('カテゴリー2'), new Label('ラベル2'));

      // action
      const media = new Media(id, title, contents, [tag1, tag2], []);

      // assert
      const tags = media.getTags();
      expect(tags.length).toBe(2);
      expect(tags[0]).toEqual(tag1);
      expect(tags[1]).toEqual(tag2);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(tag1.getCategory());
      expect(priorities[1]).toEqual(tag2.getCategory());
    });

    it('同一タグを重複して指定した場合は重複分は設定されない', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const tag1 = new Tag(new Category('カテゴリー'), new Label('ラベル'));
      const tag2 = new Tag(new Category('カテゴリー'), new Label('ラベル'));

      // action
      const media = new Media(id, title, contents, [tag1, tag2], []);

      // assert
      const tags = media.getTags();
      expect(tags.length).toBe(1);
      expect(tags[0]).toEqual(tag1);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(tag1.getCategory());
    });

    it('カテゴリー優先度を明示的に設定できる', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const category1 = new Category('カテゴリー1');
      const category2 = new Category('カテゴリー2');

      // action
      const media = new Media(id, title, contents, [], [category2, category1]);

      // assert
      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(category2);
      expect(priorities[1]).toEqual(category1);
    });

    it('タグの関連付け後にカテゴリー優先度を設定できる', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const category1 = new Category('カテゴリー1');
      const category2 = new Category('カテゴリー2');
      const tags = [
        new Tag(category1, new Label('ラベル1')),
        new Tag(category2, new Label('ラベル2')),
      ];

      // action
      const media = new Media(id, title, contents, tags, [category2, category1]);

      // assert
      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(category2);
      expect(priorities[1]).toEqual(category1);
    });

    it('カテゴリー優先度が未指定のカテゴリーはタグの関連付け順を優先度とする', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const category1 = new Category('カテゴリー1');
      const category2 = new Category('カテゴリー2');
      const tags = [
        new Tag(category1, new Label('ラベル1')),
        new Tag(category2, new Label('ラベル2')),
      ];

      // action
      const media = new Media(id, title, contents, tags, [category2]);

      // assert
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
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const media = new Media(id, title, contents, [], []);

      // action
      const newTitle = new MediaTitle('新タイトル');
      media.changeTitle(newTitle);

      // assert
      expect(media.getTitle()).toEqual(newTitle);
    });
  });

  // -------------------------
  // changeContents
  // -------------------------
  describe('Media.changeContents', () => {
    it('コンテンツを変更できる', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const media = new Media(id, title, contents, [], []);

      // action
      const newContents = [
        new ContentId('third'),
        new ContentId('second'),
        new ContentId('first'),
      ];
      media.changeContents(newContents);

      // assert
      expect(media.getContents()).toEqual(newContents);
    });

    it('コンテンツを0件に変更すると失敗する', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const media = new Media(id, title, contents, [], []);

      // action
      // assert
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
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const tag1 = new Tag(new Category('カテゴリー1'), new Label('ラベル1'));
      const media = new Media(id, title, contents, [tag1], []);

      // action
      const tag2 = new Tag(new Category('カテゴリー2'), new Label('ラベル2'));
      media.changeTags([tag2]);

      // assert
      const tags = media.getTags();
      expect(tags.length).toBe(1);
      expect(tags[0]).toEqual(tag2);

      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(tag2.getCategory());
    });

    it('同一タグを重複して設定すると重複分は設定されない', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const media = new Media(id, title, contents, [], []);

      // action
      const tag1 = new Tag(new Category('カテゴリー'), new Label('ラベル'));
      const tag2 = new Tag(new Category('カテゴリー'), new Label('ラベル'));
      media.changeTags([tag1, tag2]);

      // assert
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
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const category1 = new Category('カテゴリー1');
      const media = new Media(id, title, contents, [], [category1]);

      // action
      const category2 = new Category('カテゴリー2');
      media.changePriorityCategories([category2]);

      // assert
      const priorities = media.getPriorityCategories();
      expect(priorities[0]).toEqual(category2);
    });

    it('同一カテゴリー優先度を重複して設定すると重複分は設定されない', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const media = new Media(id, title, contents, [], []);

      // action
      const category1 = new Category('カテゴリー');
      const category2 = new Category('カテゴリー');
      media.changePriorityCategories([category1, category2]);

      // assert
      const priorities = media.getPriorityCategories();
      expect(priorities.length).toEqual(1);
      expect(priorities[0]).toEqual(category1);
    });
  });

  // -------------------------
  // getContentsByPositions
  // -------------------------
  describe('Media.getContentsByPositions', () => {
    it('コンテンツ位置がコンテンツの範囲内であればコンテンツ取得に成功する', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const media = new Media(id, title, contents, [], []);

      // action
      const contentIds = media.getContentsByPositions([1]);

      // assert
      expect(contentIds).toEqual([
        new FoundContent({
          position: 1,
          contentId: new ContentId('first'),
        }),
      ]);
    });

    it('コンテンツ位置がコンテンツの範囲外であればコンテンツ取得に失敗する', () => {
      // arrange
      const id = new MediaId('id');
      const title = new MediaTitle('タイトル');
      const contents = [
        new ContentId('first'),
        new ContentId('second'),
        new ContentId('third'),
      ];
      const media = new Media(id, title, contents, [], []);

      // action
      const contentIds = media.getContentsByPositions([4]);

      // assert
      expect(contentIds).toEqual([new NotFoundContent({ position: 4 })]);
    });
  });
});
