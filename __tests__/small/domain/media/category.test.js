const Category = require('../../../../src/domain/media/category');

describe('[Domain][Value Object][Category]', () => {
  it('カテゴリーの生成に成功する', () => {
    // arrange
    const value = 'あアaAＡａ「　」';

    // act
    const category = new Category(value);

    // assert
    expect(category).toBeInstanceOf(Category);
    expect(category.getValue()).toBe(value);
  });

  it('カテゴリーの生成に失敗する', () => {
    // arrange
    const value = 'カテ\nゴリー';

    // act
    // assert
    expect(() => {
      new Category(value);
    }).toThrow();
  });

  it.each(['', '   ', '　'])('カテゴリーが空値扱いのため生成に失敗する: "%s"', value => {
    expect(() => {
      new Category(value);
    }).toThrow();
  });

  it('同一カテゴリーは同一と判定される', () => {
    // arrange
    const category1 = new Category('カテゴリー');
    const category2 = new Category('カテゴリー');

    // act
    // assert
    expect(category1.equals(category2)).toBeTruthy();
  });

  it('異なる値のカテゴリーは同一と判定されない', () => {
    // arrange
    const category1 = new Category('カテゴリー1');
    const category2 = new Category('カテゴリー2');

    // act
    // assert
    expect(category1.equals(category2)).toBeFalsy();
  });
});
