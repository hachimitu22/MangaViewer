const RegisterMediaService = require('../../../../../src/application/media/command/RegisterMediaService');

describe('RegisterMediaService', () => {
  let service;
  let mockRepo;
  let mockIdGen;

  beforeEach(() => {
    mockRepo = { save: jest.fn() };
    mockIdGen = { generate: jest.fn() };
    service = new RegisterMediaService.service({ mediaRepository: mockRepo, idGenerator: mockIdGen });
  });

  const normalizationMedia = (media) => {
    const tags = media.getTags();
    return {
      title: media.getTitle(),
      contents: media.getContents(),
      tags: tags.map(tag => {
        return {
          category: tag.getCategory().getValue(),
          label: tag.getLabel().getLabel(),
        };
      }),
      priorityCategories: media.getPriorityCategories().map(category => category.getValue()),
    };
  };

  it('メディアを登録できる', async () => {
    // arrange
    mockIdGen.generate.mockReturnValue('new-id');
    mockRepo.save.mockResolvedValue();
    const input = new RegisterMediaService.input({ title: 'T', contents: ['c1'], tags: [], priorityCategories: [] });

    // action
    const result = await service.execute(input);

    // assert
    // 戻り値チェック
    const output = new RegisterMediaService.output({ mediaId: 'new-id' });
    await expect(result).toMatchObject(output);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    // メディア情報チェック
    const savedMedia = normalizationMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: [],
    });
  });

  it('タグが重複していても登録できる', async () => {
    // arrange
    mockIdGen.generate.mockReturnValue('new-id');
    mockRepo.save.mockResolvedValue();
    const input = new RegisterMediaService.input({
      title: 'T',
      contents: ['c1'],
      tags: [
        { category: 'A', label: 'B' },
        { category: 'A', label: 'B' },
      ],
      priorityCategories: ['A'],
    });

    // action
    const result = await service.execute(input);

    // assert
    // 戻り値チェック
    const output = new RegisterMediaService.output({ mediaId: 'new-id' });
    await expect(result).toMatchObject(output);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    // メディア情報チェック
    const savedMedia = normalizationMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      title: 'T',
      contents: ['c1'],
      tags: [
        { category: 'A', label: 'B' },
      ],
      priorityCategories: ['A'],
    });
  });

  it('コンテンツ一覧が無効なため登録に失敗する', async () => {
    await expect(
      service.execute({ title: 'T', contents: [], tags: [], priorityCategories: [] })
    ).rejects.toThrow();
  });

  it('カテゴリー優先度に矛盾があるため登録に失敗する', async () => {
    await expect(
      service.execute({ title: 'T', contents: ['c1'], tags: [], priorityCategories: ['Invalid'] })
    ).rejects.toThrow();
  });

  it('メディアの永続化に失敗した場合はエラーとなる', async () => {
    mockIdGen.generate.mockReturnValue('new-id');
    mockRepo.save.mockRejectedValue(new Error());

    await expect(
      service.execute({ title: 'T', contents: ['c1'], tags: [], priorityCategories: [] })
    ).rejects.toThrow();
  });
});
