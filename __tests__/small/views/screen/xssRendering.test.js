const ejs = require('ejs');
const path = require('path');
const vm = require('vm');

class ElementStub {
  constructor({ id = '', value = '' } = {}) {
    this.id = id;
    this.value = value;
    this.className = '';
    this.classList = {
      add: jest.fn(),
      remove: jest.fn(),
    };
    this.dataset = {};
    this.listeners = new Map();
    this.children = [];
    this.attributes = new Map();
    this.hidden = false;
    this.files = [];
    this._textContent = '';
  }

  set textContent(value) {
    this._textContent = String(value ?? '');
    if (this._textContent === '') {
      this.children = [];
    }
  }

  get textContent() {
    return this._textContent;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  appendChild(child) {
    this.children.push(child);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  click() {
    const listener = this.listeners.get('click');
    if (listener) {
      listener({ target: this, preventDefault: jest.fn() });
    }
  }
}

const extractInlineScript = html => {
  const matches = [...html.matchAll(/<script>\s*([\s\S]*?)\s*<\/script>/g)];
  if (matches.length === 0) {
    throw new Error('inline script not found');
  }

  return matches[matches.length - 1][1];
};

const createDocumentStub = ids => {
  const elements = new Map(ids.map(id => [id, new ElementStub({ id })]));

  return {
    getElementById(id) {
      const element = elements.get(id);
      if (!element) {
        throw new Error(`unknown element: ${id}`);
      }
      return element;
    },
    createElement(tagName) {
      return new ElementStub({ id: tagName });
    },
  };
};

const collectText = node => {
  const self = node.textContent || '';
  return `${self}${node.children.map(collectText).join('')}`;
};

const payload = '<img onerror="alert(1)">';

describe('screen template XSS regression', () => {
  test.each([
    {
      name: 'entry',
      templatePath: path.join(process.cwd(), 'src', 'views', 'screen', 'entry.ejs'),
      locals: {
        pageTitle: '登録',
        tagsByCategory: {},
        categoryOptions: [],
        currentPath: '/screen/entry',
        currentUserId: 'admin',
      },
      elementIds: [
        'tag-list',
        'media-list',
        'category-input',
        'tag-input',
        'tag-options',
        'add-tag-button',
        'dropzone',
        'file-input',
        'entry-form',
        'form-message',
        'title',
        'common-nav-logout',
      ],
      formId: 'entry-form',
    },
    {
      name: 'edit',
      templatePath: path.join(process.cwd(), 'src', 'views', 'screen', 'edit.ejs'),
      locals: {
        pageTitle: '編集',
        mediaDetail: { id: 'media-1', title: '編集', contents: [], tags: [], priorityCategories: [] },
        tagsByCategory: {},
        categoryOptions: [],
        currentPath: '/screen/edit/media-1',
        currentUserId: 'admin',
      },
      elementIds: [
        'tag-list',
        'media-list',
        'media-empty',
        'category-input',
        'tag-input',
        'tag-options',
        'add-tag-button',
        'dropzone',
        'file-input',
        'edit-form',
        'form-message',
        'delete-button',
        'title',
        'common-nav-logout',
      ],
      formId: 'edit-form',
    },
    {
      name: 'search',
      templatePath: path.join(process.cwd(), 'src', 'views', 'screen', 'search.ejs'),
      locals: {
        pageTitle: '検索',
        tagsByCategory: {},
        categoryOptions: [],
        summaryPage: '1',
        start: '1',
        size: '10',
        sortOptions: [{ value: 'createdAtDesc', label: '新しい順' }],
        currentPath: '/screen/search',
        currentUserId: 'admin',
      },
      elementIds: [
        'search-form',
        'summary-page',
        'title',
        'start',
        'size',
        'sort',
        'category-input',
        'tag-input',
        'tag-options',
        'tag-list',
        'add-tag-button',
        'form-message',
        'common-nav-logout',
      ],
      formId: 'search-form',
    },
  ])('$name: タグにXSSペイロードを入力してもテキストとして表示される', async ({ templatePath, locals, elementIds }) => {
    const html = await ejs.renderFile(templatePath, locals);
    const script = extractInlineScript(html);
    const document = createDocumentStub(elementIds);
    const categoryInput = document.getElementById('category-input');
    const tagInput = document.getElementById('tag-input');
    const addTagButton = document.getElementById('add-tag-button');
    const tagList = document.getElementById('tag-list');

    categoryInput.value = payload;
    tagInput.value = payload;

    vm.runInNewContext(script, {
      document,
      window: {
        location: {
          assign: jest.fn(),
          href: '/screen/search',
        },
      },
      fetch: jest.fn(),
      FormData,
      URLSearchParams,
      console,
      setTimeout,
      clearTimeout,
    });

    addTagButton.click();

    expect(tagList.children).toHaveLength(1);
    const itemText = collectText(tagList.children[0]);
    expect(itemText).toContain(payload);
  });
});
