const {
  SearchResult,
  MediaOverview,
  MediaOverviewTag,
} = require('../../../../../src/application/media/port/SearchResult');

const createTag = (overrides = {}) => ({
  category: 'genre',
  label: 'action',
  ...overrides,
});

const createMediaOverview = (overrides = {}) => ({
  mediaId: 'media-001',
  title: '作品タイトル',
  thumbnail: 'thumbnail-001',
  tags: [createTag()],
  priorityCategories: ['genre'],
  ...overrides,
});

describe('SearchResult', () => {
  test('妥当な mediaOverviews と totalCount で生成できる', () => {
    const mediaOverviews = [createMediaOverview()];

    const result = new SearchResult({ mediaOverviews, totalCount: 1 });

    expect(result.totalCount).toBe(1);
    expect(result.mediaOverviews).toHaveLength(1);
    expect(result.mediaOverviews[0]).toEqual(new MediaOverview({
      mediaId: 'media-001',
      title: '作品タイトル',
      thumbnail: 'thumbnail-001',
      tags: [new MediaOverviewTag({ category: 'genre', label: 'action' })],
      priorityCategories: ['genre'],
    }));
  });

  test('生成後の mediaOverviews 要素が MediaOverview と MediaOverviewTag として再構築される', () => {
    const mediaOverview = createMediaOverview();
    const result = new SearchResult({
      mediaOverviews: [mediaOverview],
      totalCount: 1,
    });

    expect(result.mediaOverviews[0]).toBeInstanceOf(MediaOverview);
    expect(result.mediaOverviews[0].tags[0]).toBeInstanceOf(MediaOverviewTag);
    expect(result.mediaOverviews[0]).not.toBe(mediaOverview);
    expect(result.mediaOverviews[0].tags[0]).not.toBe(mediaOverview.tags[0]);
  });

  describe('mediaOverviews の必須項目検証', () => {
    test.each([
      ['mediaId 欠落', createMediaOverview({ mediaId: undefined })],
      ['mediaId 型違反', createMediaOverview({ mediaId: 1 })],
      ['title 欠落', createMediaOverview({ title: undefined })],
      ['title 型違反', createMediaOverview({ title: 1 })],
      ['thumbnail 欠落', createMediaOverview({ thumbnail: undefined })],
      ['thumbnail 型違反', createMediaOverview({ thumbnail: 1 })],
    ])('%s の場合は Error になる', (_, mediaOverview) => {
      expect(() => new SearchResult({ mediaOverviews: [mediaOverview], totalCount: 1 })).toThrow(Error);
    });
  });

  test.each([
    ['tags が配列ではない', createMediaOverview({ tags: 'invalid' })],
    ['tags 要素の category が欠落', createMediaOverview({ tags: [createTag({ category: undefined })] })],
    ['tags 要素の label が数値', createMediaOverview({ tags: [createTag({ label: 1 })] })],
  ])('%s 場合は Error になる', (_, mediaOverview) => {
    expect(() => new SearchResult({ mediaOverviews: [mediaOverview], totalCount: 1 })).toThrow(Error);
  });

  test.each([
    ['priorityCategories が配列ではない', createMediaOverview({ priorityCategories: 'genre' })],
    ['priorityCategories 要素が文字列ではない', createMediaOverview({ priorityCategories: [1] })],
  ])('%s 場合は Error になる', (_, mediaOverview) => {
    expect(() => new SearchResult({ mediaOverviews: [mediaOverview], totalCount: 1 })).toThrow(Error);
  });

  test.each([
    ['負数', -1],
    ['小数', 1.5],
    ['非数', '1'],
    ['NaN', Number.NaN],
  ])('totalCount が %s のとき Error になる', (_, totalCount) => {
    expect(() => new SearchResult({
      mediaOverviews: [createMediaOverview()],
      totalCount,
    })).toThrow(Error);
  });
});
