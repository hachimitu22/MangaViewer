const Favorite = require('../../../../src/domain/user/favorite');
const MediaId = require('../../../../src/domain/media/mediaId');

describe('[Domain][Value Object][Favorite]', () => {
  it('有効な MediaId で生成できる', () => {
    // arrange
    const mediaId = new MediaId('media');

    // act
    const favorite = new Favorite(mediaId);

    // assert
    expect(favorite).toBeInstanceOf(Favorite);
    expect(favorite.getMediaId()).toBe(mediaId);
  });

  it('MediaId 以外を渡すと例外になる', () => {
    // arrange
    const mediaId = null;

    // act
    // assert
    expect(() => {
      new Favorite(mediaId);
    }).toThrow();
  });

  it('同じ MediaId を持つインスタンス同士が equals で同一判定される', () => {
    // arrange
    const mediaId1 = new MediaId('media');
    const mediaId2 = new MediaId('media');
    const favorite1 = new Favorite(mediaId1);
    const favorite2 = new Favorite(mediaId2);

    // act
    const actual = favorite1.equals(favorite2);

    // assert
    expect(actual).toBe(true);
  });

  it('異なる MediaId では同一判定されない', () => {
    // arrange
    const favorite1 = new Favorite(new MediaId('media1'));
    const favorite2 = new Favorite(new MediaId('media2'));

    // act
    const actual = favorite1.equals(favorite2);

    // assert
    expect(actual).toBe(false);
  });
});
