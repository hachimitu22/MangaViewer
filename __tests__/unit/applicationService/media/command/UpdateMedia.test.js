const UpdateMediaService = require('../../../../src/application/media/command/UpdateMediaService');

describe('UpdateMedia', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = { findById: jest.fn(), save: jest.fn() };
    service = new UpdateMediaService({ mediaRepository: mockRepo });
  });

  it('メディアを正常に更新できる', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'media-1', update: jest.fn() });
    mockRepo.save.mockResolvedValue();

    await expect(
      service.execute({ mediaId: 'media-1', title: 'New', contents: [], tags: [], categoryPriority: [] })
    ).resolves.toMatchObject({ mediaId: 'media-1' });
  });

  it('タグが重複していても正常に更新される', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'media-1', update: jest.fn() });
    mockRepo.save.mockResolvedValue();

    await expect(
      service.execute({ mediaId: 'media-1', title: 'New', contents: [], tags: [{ category: 'A', label: 'B' }, { category: 'A', label: 'B' }], categoryPriority: ['A'] })
    ).resolves.toMatchObject({ mediaId: 'media-1' });
  });

  it('メディアが存在しない場合はエラーとなる', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      service.execute({ mediaId: 'missing', title: '', contents: [], tags: [], categoryPriority: [] })
    ).rejects.toThrow();
  });

  it('無効なコンテンツが含まれる場合はエラーとなる', async () => {
    mockRepo.findById.mockResolvedValue({});  
    await expect(
      service.execute({ mediaId: 'media', title: '', contents: [''], tags: [], categoryPriority: [] })
    ).rejects.toThrow();
  });

  it('カテゴリー優先度に矛盾がある場合はエラーとなる', async () => {
    mockRepo.findById.mockResolvedValue({});
    await expect(
      service.execute({ mediaId: 'media', title: '', contents: [], tags: [], categoryPriority: ['Invalid'] })
    ).rejects.toThrow();
  });

  it('永続化に失敗した場合はエラーとなる', async () => {
    mockRepo.findById.mockResolvedValue({});
    mockRepo.save.mockRejectedValue(new Error());

    await expect(
      service.execute({ mediaId: 'media', title: '', contents: [], tags: [], categoryPriority: [] })
    ).rejects.toThrow();
  });
});
