const MediaTitle = require('../../../../src/domain/media/mediaTitle');

describe('[Domain][Value Object][MediaTitle]', () => {
  it('メディアタイトルの生成に成功する', () => {
    // arrange
    const value = 'あアaAＡａ「　」';

    // act
    const mediaTitle = new MediaTitle(value);

    // assert
    expect(mediaTitle).toBeInstanceOf(MediaTitle);
    expect(mediaTitle.getTitle()).toBe(value);
  });

  it('メディアタイトルの生成に失敗する', () => {
    // arrange
    const value = 'タイ\nトル';

    // act
    // assert
    expect(() => {
      new MediaTitle(value);
    }).toThrow();
  });

  it('同一メディアタイトルは同一と判定される', () => {
    // arrange
    const mediaTitle1 = new MediaTitle('メディアタイトル');
    const mediaTitle2 = new MediaTitle('メディアタイトル');

    // act
    // assert
    expect(mediaTitle1.equals(mediaTitle2)).toBeTruthy();
  });

  it('異なる値のメディアタイトルは同一と判定されない', () => {
    // arrange
    const mediaTitle1 = new MediaTitle('メディアタイトル1');
    const mediaTitle2 = new MediaTitle('メディアタイトル2');

    // act
    // assert
    expect(mediaTitle1.equals(mediaTitle2)).toBeFalsy();
  });
});
