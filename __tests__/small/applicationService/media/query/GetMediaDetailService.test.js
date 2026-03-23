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
      [new Category('C')],
      new Date('2026-03-20T12:34:00Z'),
    );
  };

  test("メディアIDをリポジトリに渡して取得できる", async () => {
    const input = new Input({ mediaId: 'ID' });
    mockRepo.findByMediaId.mockResolvedValue(createMedia());

    const result = await service.execute(input);

    expect(result).toEqual(new Output({
      mediaDetail: {
        id: 'ID',
        title: 'TITLE',
        registeredAt: '2026-03-20 12:34 UTC',
        contents: [{ id: 'CID', thumbnail: 'CID', position: 1 }],
        tags: [{ category: 'C', label: 'L' }],
        categories: ['C'],
        priorityCategories: ['C'],
      },
    }));
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  test('登録日時が取得できない場合は空文字で返す', async () => {
    const input = new Input({ mediaId: 'ID' });
    mockRepo.findByMediaId.mockResolvedValue(new Media(
      new MediaId('ID'),
      new MediaTitle('TITLE'),
      [new ContentId('CID1'), new ContentId('CID2')],
      [new Tag(new Category('作者'), new Label('山田'))],
      [new Category('作者')],
    ));

    const result = await service.execute(input);

    expect(result.mediaDetail.registeredAt).toBe('');
    expect(result.mediaDetail.categories).toEqual(['作者']);
    expect(result.mediaDetail.contents).toEqual([
      { id: 'CID1', thumbnail: 'CID1', position: 1 },
      { id: 'CID2', thumbnail: 'CID2', position: 2 },
    ]);
  });

  test("メディアID以外が指定された場合は取得に失敗する", async () => {
    const input = { ...(new Input({ mediaId: 'ID' })) };

    await expect(service.execute(input)).rejects.toThrow();
    expect(mockRepo.findByMediaId).not.toHaveBeenCalled();
  });

  test("リポジトリの取得結果が空だと取得に失敗する", async () => {
    const input = new Input({ mediaId: 'ID' });
    mockRepo.findByMediaId.mockResolvedValue(undefined);

    await expect(service.execute(input)).rejects.toThrow();
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });

  test("リポジトリの検索処理が失敗した場合は検索に失敗する", async () => {
    const input = new Input({ mediaId: 'ID' });
    mockRepo.findByMediaId.mockRejectedValue(new Error("mockRepo error"));

    await expect(service.execute(input)).rejects.toThrow("mockRepo error");
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMediaId).toHaveBeenCalledWith(new MediaId('ID'));
  });
});
