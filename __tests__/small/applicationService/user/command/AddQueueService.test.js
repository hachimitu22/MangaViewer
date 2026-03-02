const {
  Query,
  NotFoundUserResult,
  NotFoundMediaResult,
  AlreadyAddedResult,
  QueueAddedResult,
  AddQueueService: Service,
} = require('../../../../../src/application/user/command/AddQueueService');
const Media = require('../../../../../src/domain/media/media');
const MediaId = require('../../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../../src/domain/media/contentId');
const User = require('../../../../../src/domain/user/user');
const UserId = require('../../../../../src/domain/user/userId');
// mock
const MockMediaRepository = require('../../__mocks__/MockMediaRepository');
const MockUserRepository = require('../../__mocks__/MockUserRepository');

describe('AddQueueService', () => {
  let service;
  let mockMediaRepo;
  let mockUserRepo;

  beforeEach(() => {
    mockMediaRepo = new MockMediaRepository();
    mockUserRepo = new MockUserRepository();

    service = new Service({
      mediaRepository: mockMediaRepo,
      userRepository: mockUserRepo,
    });
  });

  test('メディアのあとで見るに成功した場合はあとで見る追加完了という結果が返却される', async () => {
    // arrange
    mockUserRepo.findByUserId.mockResolvedValue(new User(new UserId('uid')));
    mockMediaRepo.findByMediaId.mockResolvedValue(new Media(
      new MediaId('mid'),
      new MediaTitle('title'),
      [new ContentId('cid')], [], []
    ));

    // action
    const result = await service.execute(new Query({ userId: 'uid', mediaId: 'mid' }));

    // assert
    expect(result).toEqual(new QueueAddedResult());
    expect(mockUserRepo.findByUserId).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(new UserId('uid'));
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('mid'));

    const user = new User(new UserId('uid'))
    user.addQueue(new MediaId('mid'));
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.save).toHaveBeenCalledWith(user);
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
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledTimes(0);
    expect(mockUserRepo.save).toHaveBeenCalledTimes(0);
  });

  test('メディアが存在しない場合はメディア未発見という結果となる', async () => {
    // arrange
    mockUserRepo.findByUserId.mockResolvedValue(new User(new UserId('uid')));
    mockMediaRepo.findByMediaId.mockResolvedValue(null);

    // action
    const result = await service.execute(new Query({ userId: 'uid', mediaId: 'mid' }));

    // assert
    expect(result).toEqual(new NotFoundMediaResult());
    expect(mockUserRepo.findByUserId).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(new UserId('uid'));
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('uid'));
    expect(mockUserRepo.save).toHaveBeenCalledTimes(0);
  });

  test('追加済みのメディアをあとで見るした場合はあとで見る済みという結果が返却される', async () => {
    // arrange
    const user = new User(new UserId('uid'));
    user.addQueue(new MediaId('mid'));
    mockUserRepo.findByUserId.mockResolvedValue(user);
    mockMediaRepo.findByMediaId.mockResolvedValue(new Media(
      new MediaId('mid'),
      new MediaTitle('title'),
      [new ContentId('cid')], [], []
    ));

    // action
    const result = await service.execute(new Query({ userId: 'uid', mediaId: 'mid' }));

    // assert
    expect(result).toEqual(new AlreadyAddedResult());
    expect(mockUserRepo.findByUserId).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(new UserId('uid'));
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('mid'));
    expect(mockUserRepo.save).toHaveBeenCalledTimes(0);
  });

  test('リポジトリの操作で例外が発生したらエラーとする', async () => {
    // arrange
    mockUserRepo.findByUserId.mockResolvedValue(new User(new UserId('uid')));
    mockUserRepo.save.mockRejectedValue(new Error("mockRepo error"));
    mockMediaRepo.findByMediaId.mockResolvedValue(new Media(
      new MediaId('mid'),
      new MediaTitle('title'),
      [new ContentId('cid')], [], []
    ));

    // action
    // assert
    await expect(
      service.execute(new Query({ userId: 'uid', mediaId: 'mid' }))
    ).rejects.toThrow("mockRepo error");
    expect(mockUserRepo.findByUserId).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(new UserId('uid'));
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockMediaRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('mid'));

    const user = new User(new UserId('uid'))
    user.addQueue(new MediaId('mid'));
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.save).toHaveBeenCalledWith(user);
  });
});
