const {
  Input,
  InputSortType,
  Output,
  SearchMediaService: Service,
} = require('../../../../../src/application/media/query/SearchMediaService');
const {
  SearchCondition,
  SearchConditionTag,
  SortType,
} = require('../../../../../src/application/media/port/SearchCondition');
const {
  SearchResult,
  MediaOverview,
  MediaOverviewTag,
} = require('../../../../../src/application/media/port/SearchResult');
// mock
const MockMediaQueryRepository = require('../../__mocks__/MockMediaQueryRepository');

describe("SearchMediaService", () => {
  let mockRepo;
  let service;

  beforeEach(() => {
    mockRepo = new MockMediaQueryRepository();
    service = new Service({
      mediaQueryRepository: mockRepo,
    });
  });

  const createInput = () => {
    return new Input({
      title: 'T',
      tags: [{ category: 'C', label: 'L' }],
      sortType: InputSortType.DATE_ASC,
      start: 1,
      size: 20,
    });
  };

  // =========================
  // 正常系
  // =========================

  test("検索条件をリポジトリに渡して検索できる", async () => {
    // arrange
    const input = createInput();
    mockRepo.search.mockResolvedValue(new SearchResult({
      mediaOverviews: [
        new MediaOverview({
          mediaId: 'media-001',
          title: 'Title',
          thumbnail: 'ID',
          tags: [new MediaOverviewTag({ category: 'C', label: 'L' })],
          priorityCategories: ['C'],
        }),
      ],
      totalCount: 1,
    }));

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toEqual(new Output({
      mediaOverviews: [{
        mediaId: 'media-001',
        title: 'Title',
        thumbnail: 'ID',
        tags: [{ category: 'C', label: 'L' }],
        priorityCategories: ['C'],
      }],
      totalCount: 1,
    }));
    expect(mockRepo.search).toHaveBeenCalledTimes(1);
    expect(mockRepo.search).toHaveBeenCalledWith(new SearchCondition({
      title: 'T',
      tags: [new SearchConditionTag({ category: 'C', label: 'L' })],
      sortType: SortType.DATE_ASC,
      start: 1,
      size: 20,
    }));
  });

  test("検索結果が空でも検索は成功する", async () => {
    // arrange
    const input = createInput();
    mockRepo.search.mockResolvedValue(new SearchResult({
      mediaOverviews: [],
      totalCount: 0,
    }));

    // action
    const result = await service.execute(input);

    // assert
    expect(result).toEqual(new Output({
      mediaOverviews: [],
      totalCount: 0,
    }));
    expect(mockRepo.search).toHaveBeenCalledTimes(1);
    expect(mockRepo.search).toHaveBeenCalledWith(new SearchCondition({
      title: 'T',
      tags: [new SearchConditionTag({ category: 'C', label: 'L' })],
      sortType: SortType.DATE_ASC,
      start: 1,
      size: 20,
    }));
  });

  // =========================
  // 異常系
  // =========================
  test("検索条件以外が指定された場合は検索に失敗する", async () => {
    // arrange
    const input = { ...createInput() };

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow();
    expect(mockRepo.search).not.toHaveBeenCalled();
  });

  test("リポジトリの検索処理が失敗した場合は検索に失敗する", async () => {
    // arrange
    const input = createInput();
    mockRepo.search.mockRejectedValue(new Error("mockRepo error"));

    // action
    // assert
    await expect(service.execute(input)).rejects.toThrow("mockRepo error");
    expect(mockRepo.search).toHaveBeenCalledTimes(1);
    expect(mockRepo.search).toHaveBeenCalledWith(new SearchCondition({
      title: 'T',
      tags: [new SearchConditionTag({ category: 'C', label: 'L' })],
      sortType: SortType.DATE_ASC,
      start: 1,
      size: 20,
    }));
  });
});
