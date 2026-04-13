const Queue = require('../../../../src/domain/user/queue');
const MediaId = require('../../../../src/domain/media/mediaId');

describe('[Domain][Value Object][Queue]', () => {
  it('有効な MediaId で生成できる', () => {
    // arrange
    const mediaId = new MediaId('media');

    // act
    const queue = new Queue(mediaId);

    // assert
    expect(queue).toBeInstanceOf(Queue);
    expect(queue.getMediaId()).toBe(mediaId);
  });

  it('MediaId 以外を渡すと例外になる', () => {
    // arrange
    const mediaId = null;

    // act
    // assert
    expect(() => {
      new Queue(mediaId);
    }).toThrow();
  });

  it('同じ MediaId を持つインスタンス同士が equals で同一判定される', () => {
    // arrange
    const mediaId1 = new MediaId('media');
    const mediaId2 = new MediaId('media');
    const queue1 = new Queue(mediaId1);
    const queue2 = new Queue(mediaId2);

    // act
    const actual = queue1.equals(queue2);

    // assert
    expect(actual).toBe(true);
  });

  it('異なる MediaId では同一判定されない', () => {
    // arrange
    const queue1 = new Queue(new MediaId('media1'));
    const queue2 = new Queue(new MediaId('media2'));

    // act
    const actual = queue1.equals(queue2);

    // assert
    expect(actual).toBe(false);
  });
});
