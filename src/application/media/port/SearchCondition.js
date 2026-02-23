class SearchConditionTag {
  constructor({ category, label }) {
    this.category = category;
    this.label = label;
  }
}

const SortType = Object.freeze({
  DATE_ASC: Symbol('DATE_ASC'), // 登録日順
  DATE_DESC: Symbol('DATE_DESC'), // 登録日逆順
  TITLE_ASC: Symbol('TITLE_ASC'), // タイトル順
  TITLE_DESC: Symbol('TITLE_DESC'), // タイトル逆順
  RANDOM: Symbol('RANDOM'), // ランダム
});

class SearchCondition {
  constructor({ title, tags, sortType, start, size }) {
    if (typeof title !== 'string') {
      throw new Error();
    }
    if (!(tags instanceof Array) || !tags.every(tag => tag instanceof SearchConditionTag)) {
      throw new Error();
    }
    if (!Object.values(SortType).includes(sortType)) {
      throw new Error();
    }
    if (typeof start !== 'number' || start <= 0 || !Number.isInteger(start)) {
      throw new Error();
    }
    if (typeof size !== 'number' || size <= 0 || !Number.isInteger(size)) {
      throw new Error();
    }

    this.title = title;
    this.tags = tags;
    this.sortType = sortType;
    this.start = start;
    this.size = size;
  }
}

module.exports = {
  SearchCondition,
  SearchConditionTag,
  SortType,
};
