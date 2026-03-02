const {
  UpdateMediaServiceInput: Input,
  UpdateMediaService: Service,
} = require('../../../../../src/application/media/command/UpdateMediaService');
const Media = require('../../../../../src/domain/media/media');
const MediaId = require('../../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../../src/domain/media/contentId');
const Tag = require('../../../../../src/domain/media/tag');
const Category = require('../../../../../src/domain/media/category');
const Label = require('../../../../../src/domain/media/label');
// mock
const MockMediaRepository = require('../../__mocks__/MockMediaRepository');

describe('UpdateMediaService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = new MockMediaRepository();
    service = new Service({
      mediaRepository: mockRepo,
    });
  });

  const createOldMedia = () => {
    const id = new MediaId('id');
    const title = new MediaTitle('old-T');
    const contents = [new ContentId('old-c1')];
    const tags = [new Tag(new Category('old-A'), new Label('old-B'))];
    const priorities = [new Category('old-P')];

    return new Media(id, title, contents, tags, priorities);
  };

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

  it('メディアを更新できる', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue(createOldMedia());
    mockRepo.save.mockResolvedValue();
    const input = new Input({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: [],
    });

    // action
    await service.execute(input);

    // assert
    const savedMedia = normalizeMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: [],
    });
  });

  it('タグが重複していてもメディアの更新は成功する', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue(createOldMedia());
    mockRepo.save.mockResolvedValue();
    const input = new Input({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [
        { category: 'A', label: 'B' },
        { category: 'A', label: 'B' },
      ],
      priorityCategories: ['A'],
    });

    // action
    await service.execute(input);

    // assert
    const savedMedia = normalizeMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [{ category: 'A', label: 'B' }],
      priorityCategories: ['A'],
    });
  });

  it('カテゴリー優先度に矛盾があってもメディアの更新は成功する', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue(createOldMedia());
    mockRepo.save.mockResolvedValue();
    const input = new Input({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [{ category: 'A', label: 'B' }],
      priorityCategories: ['A', 'A'],
    });

    // action
    await service.execute(input);

    // assert
    const savedMedia = normalizeMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [{ category: 'A', label: 'B' }],
      priorityCategories: ['A'],
    });
  });

  it('コンテンツ一覧が無効だとメディアの更新は失敗する', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue(createOldMedia());
    mockRepo.save.mockResolvedValue();
    const input = new Input({
      id: 'id',
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

  it('メディアが存在しないとメディアの更新は失敗する', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue();
    mockRepo.save.mockResolvedValue();
    const input = new Input({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: []
    });

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow();
    expect(mockRepo.findByMediaId).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('メディアの永続化に失敗した場合はメディアの更新を失敗とする', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue(createOldMedia());
    mockRepo.save.mockRejectedValue(new Error('repo error'));
    const input = new Input({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: []
    });

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow('repo error');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const savedMedia = normalizeMedia(mockRepo.save.mock.calls[0][0]);
    expect(savedMedia).toMatchObject({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [],
      priorityCategories: []
    });
  });
});
