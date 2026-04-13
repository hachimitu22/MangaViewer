const ContentId = require('../../../../src/domain/media/contentId');

describe('[Domain][Value Object][ContentId]', () => {
  it('同一値のコンテンツIDは同一と判定される', () => {
    // arrange
    const id = 'id';
    const id1 = new ContentId(id);
    const id2 = new ContentId(id);

    // act
    const result = id1.equals(id2);

    // assert
    expect(result).toBeTruthy();
  });

  it('異なる値のコンテンツIDは同一と判定されない', () => {
    // arrange
    const id1 = new ContentId('id1');
    const id2 = new ContentId('id2');

    // act
    const result = id1.equals(id2)

    // assert
    expect(result).toBeFalsy();
  });
});
