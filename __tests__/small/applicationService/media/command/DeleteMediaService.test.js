const {
  DeleteMediaServiceInput: Input,
  DeleteMediaService: Service,
} = require('../../../../../src/application/media/command/DeleteMediaService');
const Media = require('../../../../../src/domain/media/media');
const MediaId = require('../../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../../src/domain/media/contentId');
const Tag = require('../../../../../src/domain/media/tag');
const Category = require('../../../../../src/domain/media/category');
const Label = require('../../../../../src/domain/media/label');
// mock
const MockMediaRepository = require('../../__mocks__/MockMediaRepository');
const MockUnitOfWork = require('../../__mocks__/MockUnitOfWork');

describe('DeleteMediaService', () => {
  let service;
  let mockRepo;
  let mockUnitOfWork;

  beforeEach(() => {
    mockRepo = new MockMediaRepository();
    mockUnitOfWork = new MockUnitOfWork();
    service = new Service({
      mediaRepository: mockRepo,
      unitOfWork: mockUnitOfWork,
    });
  });

  const createMedia = () => {
    const id = new MediaId('id');
    const title = new MediaTitle('T');
    const contents = [new ContentId('c1')];
    const tags = [new Tag(new Category('A'), new Label('B'))];
    const priorities = [new Category('A')];

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

  it('メディアを削除できる', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue(createMedia());
    mockRepo.delete.mockResolvedValue();
    const input = new Input({ id: 'id' });

    // action
    await service.execute(input);

    // assert
    const deletedMedia = normalizeMedia(mockRepo.delete.mock.calls[0][0]);
    expect(deletedMedia).toMatchObject({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [{ category: 'A', label: 'B' }],
      priorityCategories: ['A'],
    });
  });

  it('メディアが存在しないとメディアの削除は失敗する', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue(null);
    mockRepo.delete.mockResolvedValue();
    const input = new Input({ id: 'id' });

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow();
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('メディアの永続化に失敗した場合はメディアの削除を失敗とする', async () => {
    // arrange
    mockRepo.findByMediaId.mockResolvedValue(createMedia());
    mockRepo.delete.mockRejectedValue(new Error('repo error'));
    const input = new Input({ id: 'id' });

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow('repo error');
    const failedDeleteMedia = normalizeMedia(mockRepo.delete.mock.calls[0][0]);
    expect(failedDeleteMedia).toMatchObject({
      id: 'id',
      title: 'T',
      contents: ['c1'],
      tags: [{ category: 'A', label: 'B' }],
      priorityCategories: ['A'],
    });
  });
});
