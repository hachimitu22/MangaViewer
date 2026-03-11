const {
  RegisterMediaServiceInput: Input,
  RegisterMediaServiceOutput: Output,
  RegisterMediaService: Service,
} = require('../../../../../src/application/media/command/RegisterMediaService');
// mock
const MockMediaIdValueGenerator = require('../../__mocks__/MockMediaIdValueGenerator');
const MockMediaRepository = require('../../__mocks__/MockMediaRepository');
const MockUnitOfWork = require('../../__mocks__/MockUnitOfWork');

describe('RegisterMediaService', () => {
  let service;
  let mockRepo;
  let mockUnitOfWork;
  let mockIdGen;

  beforeEach(() => {
    mockRepo = new MockMediaRepository();
    mockIdGen = new MockMediaIdValueGenerator();
    mockUnitOfWork = new MockUnitOfWork();
    service = new Service({
      mediaRepository: mockRepo,
      mediaIdValueGenerator: mockIdGen,
      unitOfWork: mockUnitOfWork,
    });
  });

  const normalizeMedia = (media) => ({
    id: media.getId().getId(),
    title: media.getTitle().getTitle(),
    contents: media.getContents().map(content => content.getId()),
    tags: media.getTags().map(tag => ({
      category: tag.getCategory().getValue(),
      label: tag.getLabel().getLabel(),
    })),
    priorityCategories: media.getPriorityCategories().map(c => c.getValue()),
  });

  it('メディアの登録は成功する', async () => {
    // arrange
    mockIdGen.generate.mockReturnValue('new-id');
    mockRepo.save.mockResolvedValue();
    const input = new Input({
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: [],
    });

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toMatchObject(
      new Output({ mediaId: 'new-id' })
    );
    const savedMedia = normalizeMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      id: 'new-id',
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: [],
    });
  });

  it('タグが重複していてもメディアの登録は成功する', async () => {
    // arrange
    mockIdGen.generate.mockReturnValue('new-id');
    mockRepo.save.mockResolvedValue();
    const input = new Input({
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
    expect(result).toMatchObject(
      new Output({ mediaId: 'new-id' })
    );
    const savedMedia = normalizeMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      id: 'new-id',
      title: 'T',
      contents: ['c1'],
      tags: [{ category: 'A', label: 'B' }],
      priorityCategories: ['A'],
    });
  });

  it('カテゴリー優先度に矛盾があってもメディアの登録は成功する', async () => {
    // arrange
    mockIdGen.generate.mockReturnValue('new-id');
    mockRepo.save.mockResolvedValue();
    const input = new Input({
      title: 'T',
      contents: ['c1'],
      tags: [{ category: 'A', label: 'B' }],
      priorityCategories: ['A', 'A'],
    });

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toMatchObject(
      new Output({ mediaId: 'new-id' })
    );
    const savedMedia = normalizeMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      id: 'new-id',
      title: 'T',
      contents: ['c1'],
      tags: [{ category: 'A', label: 'B' }],
      priorityCategories: ['A'],
    });
  });

  it('コンテンツ一覧が無効だとメディアの登録は失敗する', async () => {
    // arrange
    mockIdGen.generate.mockReturnValue('new-id');
    mockRepo.save.mockResolvedValue();
    const input = new Input({
      title: 'T',
      contents: [],
      tags: [],
      priorityCategories: ['A']
    });

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('メディアの永続化に失敗した場合はメディアの登録を失敗とする', async () => {
    // arrange
    mockIdGen.generate.mockReturnValue('new-id');
    mockRepo.save.mockRejectedValue(new Error('repo error'));
    const input = new Input({
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: []
    });

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow('repo error');
    const savedMedia = normalizeMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      id: 'new-id',
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: []
    });
  });
});
