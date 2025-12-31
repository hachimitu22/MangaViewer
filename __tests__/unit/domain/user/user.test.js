const User = require('../../../../src/domain/user/user');
const UserId = require('../../../../src/domain/user/userId');
const MediaId = require('../../../../src/domain/media/mediaId');

describe('[Domain][Aggregate][User]', () => {
  it('ユーザーの生成に成功する', () => {
    // arrange
    const userId = new UserId('id');

    // act
    const user = new User(userId);

    // assert
    expect(user).toBeInstanceOf(User);
    expect(user.getUserId()).toBe(userId);
    expect(user.getFavorites()).toEqual([]);
    expect(user.getQueue()).toEqual([]);
  });

  it('ユーザーの生成に失敗する', () => {
    // arrange
    const userId = null;

    // act
    // assert
    expect(() => {
      new User(userId);
    }).toThrow();
  });

  it('メディアをお気に入りに追加できる', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = new MediaId('media');

    // act
    user.addFavorite(mediaId);

    // assert
    const favorites = user.getFavorites();
    expect(favorites.length).toBe(1);
    expect(favorites[0]).toEqual(mediaId);
    expect(user.getQueue()).toEqual([]);
  });

  it('メディア以外はお気に入りに追加できない', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = null;

    // act
    // assert
    expect(() => {
      user.addFavorite(mediaId);
    }).toThrow();
  });

  it('お気に入りに追加されたメディアはお気に入りに追加できない', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = new MediaId('media');
    user.addFavorite(mediaId);

    // act
    // assert
    expect(() => {
      user.addFavorite(mediaId);
    }).toThrow();
    const favorites = user.getFavorites();
    expect(favorites.length).toBe(1);
    expect(favorites[0]).toEqual(mediaId);
    expect(user.getQueue()).toEqual([]);
  });

  it('お気に入りは登録順を保持する', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId1 = new MediaId('media1');
    const mediaId2 = new MediaId('media2');

    // act
    user.addFavorite(mediaId1);
    user.addFavorite(mediaId2);

    // assert
    const favorites = user.getFavorites();
    expect(favorites.length).toBe(2);
    expect(favorites[0]).toEqual(mediaId1);
    expect(favorites[1]).toEqual(mediaId2);
    expect(user.getQueue()).toEqual([]);
  });

  it('お気に入りを削除できる', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = new MediaId('media');
    user.addFavorite(mediaId);

    // act
    user.removeFavorite(mediaId);

    // assert
    const favorites = user.getFavorites();
    expect(favorites).toEqual([]);
    expect(user.getQueue()).toEqual([]);
  });

  it('お気に入りに追加していないメディアをお気に入りから削除できない', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = new MediaId('media');
    user.addFavorite(mediaId);

    // act
    // assert
    expect(() => {
      user.removeFavorite(new MediaId('media1'));
    }).toThrow();
    const favorites = user.getFavorites();
    expect(favorites.length).toBe(1);
    expect(favorites[0]).toEqual(mediaId);
    expect(user.getQueue()).toEqual([]);
  });


  it('メディアをあとで見るに追加できる', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = new MediaId('media');

    // act
    user.addQueue(mediaId);

    // assert
    const queue = user.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0]).toEqual(mediaId);
    expect(user.getFavorites()).toEqual([]);
  });

  it('メディア以外はあとで見るに追加できない', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = null;

    // act
    // assert
    expect(() => {
      user.addQueue(mediaId);
    }).toThrow();
  });

  it('あとで見るに追加されたメディアはあとで見るに追加できない', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = new MediaId('media');
    user.addQueue(mediaId);

    // act
    // assert
    expect(() => {
      user.addQueue(mediaId);
    }).toThrow();
    const queue = user.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0]).toEqual(mediaId);
    expect(user.getFavorites()).toEqual([]);
  });

  it('あとで見るは登録順を保持する', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId1 = new MediaId('media1');
    const mediaId2 = new MediaId('media2');

    // act
    user.addQueue(mediaId1);
    user.addQueue(mediaId2);

    // assert
    const queue = user.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0]).toEqual(mediaId1);
    expect(queue[1]).toEqual(mediaId2);
    expect(user.getFavorites()).toEqual([]);
  });

  it('あとで見るを削除できる', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = new MediaId('media');
    user.addQueue(mediaId);

    // act
    user.removeQueue(mediaId);

    // assert
    const queue = user.getQueue();
    expect(queue).toEqual([]);
    expect(user.getFavorites()).toEqual([]);
  });

  it('お気に入りに追加していないメディアをお気に入りから削除できない', () => {
    // arrange
    const user = new User(new UserId('id'));
    const mediaId = new MediaId('media');
    user.addQueue(mediaId);

    // act
    // assert
    expect(() => {
      user.removeQueue(new MediaId('media1'));
    }).toThrow();
    const queue = user.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0]).toEqual(mediaId);
    expect(user.getFavorites()).toEqual([]);
  });

});
