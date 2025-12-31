const UserId = require('../../../../src/domain/user/userId');

describe('[Domain][Value Object][UserId]', () => {
  it('ユーザーIDの生成に成功する', () => {
    // arrange
    const id = '' +
      'abcdefghijklmnopqrstuvwxyz' +
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
      '0123456789'
      ;

    // act
    const userId = new UserId(id);

    // assert
    expect(userId).toBeInstanceOf(UserId);
    expect(userId.getId()).toBe(id);
  });

  it('ユーザーIDの生成に失敗する', () => {
    // arrange
    const id = '' +
      'abcdefghijklmnopqrstuvwxyz' +
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
      '0123456789' +
      '_'
      ;

    // act
    // assert
    expect(() => {
      new UserId(id);
    }).toThrow();
  });

  it('同じ値のユーザーIDは同一と判定される', () => {
    // arrange
    const userId1 = new UserId('user');
    const userId2 = new UserId('user');

    // act
    // assert
    expect(userId1.equals(userId2)).toBeTruthy();
  });

  it('異なる値のユーザーIDは同一と判定されない', () => {
    // arrange
    const userId1 = new UserId('user1');
    const userId2 = new UserId('user2');

    // act
    // assert
    expect(userId1.equals(userId2)).toBeFalsy();
  });
});
