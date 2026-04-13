const Label = require('../../../../src/domain/media/label');

describe('[Domain][Value Object][Label]', () => {
  it('ラベルの生成に成功する', () => {
    // arrange
    const value = 'あアaAＡａ「　」';

    // act
    const label = new Label(value);

    // assert
    expect(label).toBeInstanceOf(Label);
    expect(label.getLabel()).toBe(value);
  });

  it('ラベルの生成に失敗する', () => {
    // arrange
    const value = 'ラ\nベル';

    // act
    // assert
    expect(() => {
      new Label(value);
    }).toThrow();
  });

  it.each(['', '   ', '　'])('ラベルが空値扱いのため生成に失敗する: "%s"', value => {
    expect(() => {
      new Label(value);
    }).toThrow();
  });

  it('同一ラベルは同一と判定される', () => {
    // arrange
    const label1 = new Label('ラベル');
    const label2 = new Label('ラベル');

    // act
    // assert
    expect(label1.equals(label2)).toBeTruthy();
  });

  it('異なる値のラベルは同一と判定されない', () => {
    // arrange
    const label1 = new Label('ラベル1');
    const label2 = new Label('ラベル2');

    // act
    // assert
    expect(label1.equals(label2)).toBeFalsy();
  });
});
