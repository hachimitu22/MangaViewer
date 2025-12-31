const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');

describe('[Domain][Value Object][Tag]', () => {
  it('タグの生成に成功する', () => {
    // arrange
    const category = new Category('カテゴリー');
    const label = new Label('ラベル');

    // act
    const tag = new Tag(category, label);

    // assert
    expect(tag).toBeInstanceOf(Tag);
    expect(tag.getCategory()).toBe(category);
    expect(tag.getLabel()).toBe(label);
  });

  it('タグの生成に失敗する（カテゴリーが無効）', () => {
    // arrange
    const category = null;
    const label = new Label('ラベル');

    // act
    // assert
    expect(() => {
      new Tag(category, label);
    }).toThrow();
  });

  it('タグの生成に失敗する（ラベルが無効）', () => {
    // arrange
    const category = new Category('カテゴリー');
    const label = null;

    // act
    // assert
    expect(() => {
      new Tag(category, label);
    }).toThrow();
  });

  it('タグの生成に失敗する（カテゴリー・ラベルのいずれも無効）', () => {
    // arrange
    const category = null;
    const label = null;

    // act
    // assert
    expect(() => {
      new Tag(category, label);
    }).toThrow();
  });

  it('同一カテゴリー・同一ラベルのタグは同一と判定される', () => {
    // arrange
    const tag1 = new Tag(new Category('カテゴリー'), new Label('ラベル'));
    const tag2 = new Tag(new Category('カテゴリー'), new Label('ラベル'));

    // act
    // assert
    expect(tag1.equals(tag2)).toBeTruthy();
  });

  it('カテゴリーが異なるタグは同一と判定されない', () => {
    // arrange
    const tag1 = new Tag(new Category('カテゴリー1'), new Label('ラベル'));
    const tag2 = new Tag(new Category('カテゴリー2'), new Label('ラベル'));

    // act
    // assert
    expect(tag1.equals(tag2)).toBeFalsy();
  });

  it('ラベルが異なるタグは同一と判定されない', () => {
    // arrange
    const tag1 = new Tag(new Category('カテゴリー'), new Label('ラベル1'));
    const tag2 = new Tag(new Category('カテゴリー'), new Label('ラベル2'));

    // act
    // assert
    expect(tag1.equals(tag2)).toBeFalsy();
  });

  it('カテゴリーとラベルどちらも異なるタグは同一と判定されない', () => {
    // arrange
    const tag1 = new Tag(new Category('カテゴリー1'), new Label('ラベル1'));
    const tag2 = new Tag(new Category('カテゴリー2'), new Label('ラベル2'));

    // act
    // assert
    expect(tag1.equals(tag2)).toBeFalsy();
  });
});
