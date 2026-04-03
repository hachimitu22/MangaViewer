const ejs = require('ejs');
const path = require('path');
const vm = require('vm');

const templatePath = path.join(process.cwd(), 'src', 'views', 'screen', 'edit.ejs');

class ElementStub {
  constructor({ id = '', value = '' } = {}) {
    this.id = id;
    this.value = value;
    this.innerHTML = '';
    this.textContent = '';
    this.className = '';
    this.hidden = false;
    this.dataset = {};
    this.files = [];
    this.listeners = new Map();
    this.children = [];
    this.classList = {
      add: jest.fn(),
      remove: jest.fn(),
    };
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  appendChild(child) {
    this.children.push(child);
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

const createDocumentStub = () => {
  const elements = new Map([
    ['tag-list', new ElementStub({ id: 'tag-list' })],
    ['media-list', new ElementStub({ id: 'media-list' })],
    ['media-empty', new ElementStub({ id: 'media-empty' })],
    ['category-input', new ElementStub({ id: 'category-input' })],
    ['tag-input', new ElementStub({ id: 'tag-input' })],
    ['tag-options', new ElementStub({ id: 'tag-options' })],
    ['add-tag-button', new ElementStub({ id: 'add-tag-button' })],
    ['dropzone', new ElementStub({ id: 'dropzone' })],
    ['file-input', new ElementStub({ id: 'file-input' })],
    ['edit-form', new ElementStub({ id: 'edit-form' })],
    ['form-message', new ElementStub({ id: 'form-message' })],
    ['delete-button', new ElementStub({ id: 'delete-button' })],
    ['title', new ElementStub({ id: 'title', value: '作品タイトル' })],
    ['common-nav-logout', new ElementStub({ id: 'common-nav-logout' })],
  ]);

  return {
    elements,
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

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

const renderAndBoot = async ({ confirmResult, fetchImpl }) => {
  const html = await ejs.renderFile(templatePath, {
    pageTitle: '作品タイトル の編集',
    mediaDetail: {
      id: 'media-1',
      title: '作品タイトル',
      contents: [],
      tags: [],
      priorityCategories: [],
    },
    tagsByCategory: {},
    categoryOptions: [],
  });
  const script = extractInlineScript(html);
  const document = createDocumentStub();
  const window = {
    confirm: jest.fn().mockReturnValue(confirmResult),
    location: { href: '/screen/edit/media-1' },
  };

  vm.runInNewContext(script, {
    document,
    window,
    fetch: fetchImpl,
    FormData,
    URL: { createObjectURL: jest.fn() },
    console,
    setTimeout,
    clearTimeout,
  });

  return {
    document,
    window,
    deleteButton: document.getElementById('delete-button'),
    formMessage: document.getElementById('form-message'),
  };
};

describe('screen/edit template', () => {
  test('削除確認をキャンセルした場合は DELETE を呼ばず編集画面に留まる', async () => {
    const fetchMock = jest.fn();
    const { deleteButton, formMessage, window } = await renderAndBoot({
      confirmResult: false,
      fetchImpl: fetchMock,
    });

    deleteButton.click();
    await flushPromises();

    expect(window.confirm).toHaveBeenCalledWith('このメディアを削除します。よろしいですか？');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/screen/edit/media-1');
    expect(formMessage.textContent).toBe('');
  });

  test('削除確認後に成功した場合は DELETE を呼んで一覧へ戻る', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: 0 }),
    });
    const { deleteButton, formMessage, window } = await renderAndBoot({
      confirmResult: true,
      fetchImpl: fetchMock,
    });

    deleteButton.click();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith('/api/media/media-1', {
      method: 'DELETE',
    });
    expect(window.location.href).toBe('/screen/summary');
    expect(formMessage.textContent).toBe('');
  });

  test('削除確認後に失敗した場合は form-message にエラーを表示する', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ code: 1, message: '削除に失敗しました。' }),
    });
    const { deleteButton, formMessage, window } = await renderAndBoot({
      confirmResult: true,
      fetchImpl: fetchMock,
    });

    deleteButton.click();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith('/api/media/media-1', {
      method: 'DELETE',
    });
    expect(window.location.href).toBe('/screen/edit/media-1');
    expect(formMessage.className).toBe('message error');
    expect(formMessage.textContent).toBe('削除に失敗しました。');
  });
});
