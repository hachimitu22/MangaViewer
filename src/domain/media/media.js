const Tag = require('./tag');

class Content {
  #value;
  constructor(value) {
    this.#value = value;
  }
  getValue() {
    return {
      ...this.#value,
    };
  }
}

module.exports = class Media {
  #id;
  #title;
  #contents = [];
  #tags = [];
  #priorityCategories = [];
  constructor(id, title, contents) {
    if (!(contents instanceof Array) || contents.length === 0) {
      throw new Error();
    }

    this.#id = id;
    this.#title = title;
    this.setContents(contents);
  }
  getId() {
    return this.#id;
  }
  getTitle() {
    return this.#title;
  }
  setContents(contents) {
    this.#contents = contents.map(content => new Content(content));
  }
  getContents() {
    return [...this.#contents.map(content => content.getValue())];
  }
  addTag(tag) {
    if (!(tag instanceof Tag)) {
      throw new Error();
    }

    // 重複チェック
    if (this.#tags.some(t => t.equals(tag))) {
      throw new Error();
    }
    this.#tags.push(tag);

    // カテゴリー優先度が未指定のタグカテゴリーだった場合、カテゴリー優先度を最下位に設定する
    if (!this.#priorityCategories.some(p => p.equals(tag.getCategory()))) {
      this.#priorityCategories.push(tag.getCategory());
    }
  }
  getTags() {
    return this.#tags;
  }
  setPriorityCategories(categories) {
    this.#priorityCategories = categories;

    this.#tags.forEach(tag => {
      const category = tag.getCategory();
      if (!this.#priorityCategories.some(p => p.equals(category))) {
        this.#priorityCategories.push(tag.getCategory());
      }
    });
  }
  getPriorityCategories() {
    return this.#priorityCategories;
  }
}