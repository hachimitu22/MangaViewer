const MediaId = require('../../../../src/domain/media/mediaId');

describe('[Domain][Value Object][MediaId]', () => {
  it('同一値のメディアIDは同一と判定される', () => {
    // arrange
    const id = Symbol('id');

    // act
    const id1 = new MediaId(id);
    const id2 = new MediaId(id);

    // assert
    expect(id1.equals(id2)).toBeTruthy();
  });

  it('異なる値のメディアIDは同一と判定されない', () => {
    // arrange
    const id = Symbol('id');

    // act
    const id1 = new MediaId(Symbol('id1'));
    const id2 = new MediaId(Symbol('id2'));

    // assert
    expect(id1.equals(id2)).toBeFalsy();
  });
});
