const UUIDMediaIdValueGenerator = require('../../../src/infrastructure/UUIDMediaIdValueGenerator');

describe('UUIDMediaIdValueGenerator', () => {
  test('generate はハイフンなし 32 文字の UUID を返す', () => {
    const generator = new UUIDMediaIdValueGenerator();

    const actual = generator.generate();

    expect(actual).toMatch(/^[0-9a-f]{32}$/);
  });

  test('generate は呼び出しごとに異なる値を返す', () => {
    const generator = new UUIDMediaIdValueGenerator();

    const first = generator.generate();
    const second = generator.generate();

    expect(first).not.toBe(second);
  });
});
