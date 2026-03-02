const {
  Input,
  Output,
  GetMediaDetailService: Service,
} = require('../../../../../src/application/media/query/GetMediaDetailService');
const Media = require('../../../../../src/domain/media/media');
const MediaId = require('../../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../../src/domain/media/contentId');
const Tag = require('../../../../../src/domain/media/tag');
const Category = require('../../../../../src/domain/media/category');
const Label = require('../../../../../src/domain/media/label');
// mock
const MockMediaRepository = require('../../__mocks__/MockMediaRepository');

describe("GetMediaDetailService", () => {
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
      [new ContentId('CID')],
      [new Tag(new Category('C'), new Label('L'))],
      [new Category('C')]
    );
  };

  // =========================
  // 正常系
  // =========================

  test("メディアIDをリポジトリに渡して取得できる", async () => {
    // arrange
    const input = new Input({ mediaId: 'ID' });
    mockRepo.findByMediaId.mockResolvedValue(createMedia());

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toEqual(new Output({
      mediaDetail: {
        id: 'ID',
        title: 'TITLE',
        contents: ['CID'],
        tags: [{ category: 'C', label: 'L' }],
        priorityCategories: ['C'],
      },
    }));
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  // =========================
  // 異常系
  // =========================
  test("メディアID以外が指定された場合は取得に失敗する", async () => {
    // arrange
    const input = { ...(new Input({ mediaId: 'ID' })) };

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow();
    expect(mockRepo.findByMediaId).not.toHaveBeenCalled();
  });

  test("リポジトリの取得結果が空だと取得に失敗する", async () => {
    // arrange
    const input = new Input({ mediaId: 'ID' });
    mockRepo.findByMediaId.mockResolvedValue(undefined);

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow();
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  test("リポジトリの検索処理が失敗した場合は検索に失敗する", async () => {
    // arrange
    const input = new Input({ mediaId: 'ID' });
    mockRepo.findByMediaId.mockRejectedValue(new Error("mockRepo error"));

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow("mockRepo error");
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });
});
