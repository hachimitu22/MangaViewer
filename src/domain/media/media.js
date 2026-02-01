const MediaId = require('./mediaId');
const MediaTitle = require('./mediaTitle');
const ContentId = require('./contentId');
const Tag = require('./tag');
const Category = require('./category');

module.exports = class Media {
  #id;
  #title;
  #contents = [];
  #tags = [];
  #priorityCategories = [];
  constructor(id, title, contents, tags, priorityCategories) {
    if (!(id instanceof MediaId)) {
      throw new Error();
    }

    this.#id = id;
    this.changeTitle(title);
    this.changeContents(contents);
    this.changeTags(tags);
    this.changePriorityCategories(priorityCategories);
  }
  getId() {
    return this.#id;
  }
  changeTitle(title) {
    if (!(title instanceof MediaTitle)) {
      throw new Error();
    }
    this.#title = title;
  }
  getTitle() {
    return this.#title;
  }
  changeContents(contents) {
    if (!(contents instanceof Array) || contents.length === 0 || !contents.every(content => content instanceof ContentId)) {
      throw new Error();
    }
    this.#contents = contents;
  }
  getContents() {
    return this.#contents;
  }
  changeTags(tags) {
    if (!(tags instanceof Array) || !tags.every(tag => tag instanceof Tag)) {
      throw new Error();
    }

    this.#tags = tags.reduce((arr, tag) => {
      if (!arr.some(t => t.equals(tag))) {
        arr.push(tag);
      }

      return arr;
    }, []);
  }
  getTags() {
    return this.#tags;
  }
  changePriorityCategories(priorityCategories) {
    if (!(priorityCategories instanceof Array)) {
      throw new Error();
    }
    if (!priorityCategories.every(category => category instanceof Category)) {
      throw new Error();
    }

    this.#priorityCategories = priorityCategories.reduce((arr, category) => {
      if (!arr.some(t => t.equals(category))) {
        arr.push(category);
      }

      return arr;
    }, []);
  }
  getPriorityCategories() {
    const arr = [...this.#priorityCategories];
    this.#tags.forEach(tag => {
      const category = tag.getCategory();
      const hasPriorityCategory = arr.some(p => p.equals(category));
      if (!hasPriorityCategory) {
        arr.push(category);
      }
    });
    return arr;
  }
}
