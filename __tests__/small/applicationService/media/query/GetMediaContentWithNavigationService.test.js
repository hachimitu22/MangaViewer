const {
  Input,
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
  GetMediaContentWithNavigationService: Service,
} = require('../../../../../src/application/media/query/GetMediaContentWithNavigationService');
const Media = require('../../../../../src/domain/media/media');
const MediaId = require('../../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../../src/domain/media/contentId');
const Tag = require('../../../../../src/domain/media/tag');
const Category = require('../../../../../src/domain/media/category');
const Label = require('../../../../../src/domain/media/label');
// mock
const MockMediaRepository = require('../../__mocks__/MockMediaRepository');

describe("GetMediaContentWithNavigationService", () => {
  let mockRepo;
  let service;

  beforeEach(() => {
    mockRepo = new MockMediaRepository();
    service = new Service({
      mediaRepository: mockRepo,
    });
  });

  const createMedia = () => {
    return new Media(
      new MediaId('ID'),
      new MediaTitle('TITLE'),
      [
        new ContentId('CID1'),
        new ContentId('CID2'),
        new ContentId('CID3'),
      ],
      [new Tag(new Category('C'), new Label('L'))],
      [new Category('C')]
    );
  };

  test('指定のコンテンツと前後のコンテンツを取得できる', async () => {
    // arrange
    const input = new Input({ mediaId: 'ID', contentPosition: 2 });
    mockRepo.findByMediaId.mockResolvedValue(createMedia());

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toEqual(new FoundResult({
      contentId: 'CID2',
      previousContentId: 'CID1',
      nextContentId: 'CID3',
    }));
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  test('指定のコンテンツと1つ後のコンテンツを取得できる', async () => {
    // arrange
    const input = new Input({ mediaId: 'ID', contentPosition: 1 });
    mockRepo.findByMediaId.mockResolvedValue(createMedia());

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toEqual(new FoundResult({
      contentId: 'CID1',
      previousContentId: null,
      nextContentId: 'CID2',
    }));
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  test('指定のコンテンツと1つ前のコンテンツを取得できる', async () => {
    // arrange
    const input = new Input({ mediaId: 'ID', contentPosition: 3 });
    mockRepo.findByMediaId.mockResolvedValue(createMedia());

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toEqual(new FoundResult({
      contentId: 'CID3',
      previousContentId: 'CID2',
      nextContentId: null,
    }));
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  test('指定したコンテンツが存在しない場合コンテンツなしとなる', async () => {
    // arrange
    const input = new Input({ mediaId: 'ID', contentPosition: 4 });
    mockRepo.findByMediaId.mockResolvedValue(createMedia());

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toEqual(new ContentNotFoundResult());
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  test('指定したメディアが存在しない場合メディアなしとなる', async () => {
    // arrange
    const input = new Input({ mediaId: 'ID', contentPosition: 1 });
    mockRepo.findByMediaId.mockResolvedValue(null);

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toEqual(new MediaNotFoundResult());
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  test('リポジトリの操作で例外が発生したらエラーとする', async () => {
    // arrange
    const input = new Input({ mediaId: 'ID', contentPosition: 1 });
    mockRepo.findByMediaId.mockRejectedValue(new Error("mockRepo error"));

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow("mockRepo error");
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });
});
