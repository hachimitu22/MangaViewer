const {
  Query,
  QueueRemovedResult,
  NotFoundUserResult,
  NotAddedMediaResult,
  RemoveQueueService: Service,
} = require('../../../../../src/application/user/command/RemoveQueueService');
const MediaId = require('../../../../../src/domain/media/mediaId');
const User = require('../../../../../src/domain/user/user');
const UserId = require('../../../../../src/domain/user/userId');
// mock
const MockUserRepository = require('../../__mocks__/MockUserRepository');

describe('RemoveQueueService', () => {
  let service;
  let mockUserRepo;

  beforeEach(() => {
    mockUserRepo = new MockUserRepository();

    service = new Service({
      userRepository: mockUserRepo,
    });
  });

  test('あとで見るからのメディア削除に成功した場合はあとで見る削除完了という結果が返却される', async () => {
    // arrange
    const user = new User(new UserId('uid'));
    user.addQueue(new MediaId('mid'));
    mockUserRepo.findByUserId.mockResolvedValue(user);

    // action
    const result = await service.execute(new Query({ userId: 'uid', mediaId: 'mid' }));

    // assert
    expect(result).toEqual(new QueueRemovedResult());
    expect(mockUserRepo.findByUserId).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(new UserId('uid'));

    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.save).toHaveBeenCalledWith(new User(new UserId('uid')));
  });

  test('ユーザーが存在しない場合はユーザー未発見という結果となる', async () => {
    // arrange
    mockUserRepo.findByUserId.mockResolvedValue(null);

    // action
    const result = await service.execute(new Query({ userId: 'uid', mediaId: 'mid' }));

    // assert
    expect(result).toEqual(new NotFoundUserResult());
    expect(mockUserRepo.findByUserId).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(new UserId('uid'));

    expect(mockUserRepo.save).toHaveBeenCalledTimes(0);
  });

  test('あとで見るしていないメディアを削除した場合はあとで見る不在という結果が返却される', async () => {
    // arrange
    mockUserRepo.findByUserId.mockResolvedValue(new User(new UserId('uid')));

    // action
    const result = await service.execute(new Query({ userId: 'uid', mediaId: 'mid' }));

    // assert
    expect(result).toEqual(new NotAddedMediaResult());
    expect(mockUserRepo.findByUserId).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(new UserId('uid'));

    expect(mockUserRepo.save).toHaveBeenCalledTimes(0);
  });

  test('リポジトリの操作で例外が発生したらエラーとする', async () => {
    // arrange
    const user = new User(new UserId('uid'));
    user.addQueue(new MediaId('mid'));
    mockUserRepo.findByUserId.mockResolvedValue(user);
    mockUserRepo.save.mockRejectedValue(new Error("mockRepo error"));

    // action
    // assert
    await expect(
      service.execute(new Query({ userId: 'uid', mediaId: 'mid' }))
    ).rejects.toThrow("mockRepo error");
    expect(mockUserRepo.findByUserId).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(new UserId('uid'));

    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.save).toHaveBeenCalledWith(new User(new UserId('uid')));
  });
});
