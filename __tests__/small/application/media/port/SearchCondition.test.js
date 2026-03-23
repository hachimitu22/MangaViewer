const {
  SearchCondition,
  SearchConditionTag,
  SortType,
} = require('../../../../../src/application/media/port/SearchCondition');

describe('SearchCondition', () => {
  test('妥当な title / tags / sortType / start / size で生成できる', () => {
    const tags = [
      new SearchConditionTag({ category: 'ジャンル', label: 'アクション' }),
      new SearchConditionTag({ category: '状態', label: '連載中' }),
    ];

    const condition = new SearchCondition({
      title: '検索タイトル',
      tags,
      sortType: SortType.TITLE_ASC,
      start: 1,
      size: 20,
    });

    expect(condition).toBeInstanceOf(SearchCondition);
    expect(condition.title).toBe('検索タイトル');
    expect(condition.tags).toEqual(tags);
    expect(condition.sortType).toBe(SortType.TITLE_ASC);
    expect(condition.start).toBe(1);
    expect(condition.size).toBe(20);
  });

  test('title が非文字列のとき Error になる', () => {
    const invalidTitles = [undefined, null, 123, {}, [], true];

    invalidTitles.forEach((title) => {
      expect(() => new SearchCondition({
        title,
        tags: [],
        sortType: SortType.DATE_ASC,
        start: 1,
        size: 10,
      })).toThrow(Error);
    });
  });

  test('tags が配列でない、または SearchConditionTag 以外を含むと Error になる', () => {
    const invalidTagsList = [
      undefined,
      null,
      'tag',
      {},
      new SearchConditionTag({ category: 'ジャンル', label: 'アクション' }),
      [{}],
      [{ category: 'ジャンル', label: 'アクション' }],
      [new SearchConditionTag({ category: 'ジャンル', label: 'アクション' }), 'invalid'],
    ];

    invalidTagsList.forEach((tags) => {
      expect(() => new SearchCondition({
        title: '検索タイトル',
        tags,
        sortType: SortType.DATE_ASC,
        start: 1,
        size: 10,
      })).toThrow(Error);
    });
  });

  test('sortType が列挙値以外だと Error になる', () => {
    const invalidSortTypes = [undefined, null, 'DATE_ASC', Symbol('DATE_ASC'), {}, 1];

    invalidSortTypes.forEach((sortType) => {
      expect(() => new SearchCondition({
        title: '検索タイトル',
        tags: [],
        sortType,
        start: 1,
        size: 10,
      })).toThrow(Error);
    });
  });

  test.each([
    ['start', 0],
    ['start', -1],
    ['start', 1.5],
    ['start', NaN],
    ['size', 0],
    ['size', -1],
    ['size', 1.5],
    ['size', NaN],
  ])('%s が %p のとき Error になる', (target, invalidValue) => {
    const params = {
      title: '検索タイトル',
      tags: [],
      sortType: SortType.DATE_ASC,
      start: 1,
      size: 10,
      [target]: invalidValue,
    };

    expect(() => new SearchCondition(params)).toThrow(Error);
  });
});
