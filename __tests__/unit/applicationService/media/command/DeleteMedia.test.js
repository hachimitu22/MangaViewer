const DeleteMediaService = require('../../../../src/application/media/command/DeleteMediaService');
// TODO: import your repository interface mocks

describe('DeleteMedia', () => {
  let deleteMedia;
  let mockRepo;

  beforeEach(() => {
    mockRepo = {
      exists: jest.fn(),
      delete: jest.fn(),
    };
    deleteMedia = new DeleteMediaService({ mediaRepository: mockRepo });
  });

  it('指定したメディアを削除できる', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockRepo.delete.mockResolvedValue();

    await expect(
      deleteMedia.execute({ mediaId: 'media-001' })
    ).resolves.not.toThrow();

    expect(mockRepo.delete).toHaveBeenCalledWith('media-001');
  });

  it('指定されたメディアが存在しない場合は削除できない', async () => {
    mockRepo.exists.mockResolvedValue(false);

    await expect(
      deleteMedia.execute({ mediaId: 'missing' })
    ).rejects.toThrow();
  });

  it('Repository で削除処理に失敗した場合は削除できない', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockRepo.delete.mockRejectedValue(new Error('fail'));

    await expect(
      deleteMedia.execute({ mediaId: 'media-001' })
    ).rejects.toThrow();
  });
});
