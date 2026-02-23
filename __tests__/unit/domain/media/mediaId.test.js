const MediaId = require('../../../../src/domain/media/mediaId');

describe('[Domain][Value Object][MediaId]', () => {
  it('同一値のメディアIDは同一と判定される', () => {
    // arrange
    const id = 'id';
    const id1 = new MediaId(id);
    const id2 = new MediaId(id);

    // act
    const result = id1.equals(id2);

    // assert
    expect(result).toBeTruthy();
  });

  it('異なる値のメディアIDは同一と判定されない', () => {
    // arrange
    const id1 = new MediaId('id1');
    const id2 = new MediaId('id2');

    // act
    const result = id1.equals(id2)

    // assert
    expect(result).toBeFalsy();
  });
});
