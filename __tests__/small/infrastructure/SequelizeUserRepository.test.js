const { Sequelize } = require('sequelize');

const SequelizeUnitOfWork = require('../../../src/infrastructure/SequelizeUnitOfWork');
const SequelizeUserRepository = require('../../../src/infrastructure/SequelizeUserRepository');
const User = require('../../../src/domain/user/user');
const UserId = require('../../../src/domain/user/userId');
const MediaId = require('../../../src/domain/media/mediaId');

const createUser = ({ userId = 'user-001', favorites = [], queue = [] } = {}) => {
  const user = new User(new UserId(userId));
  favorites.forEach(mediaId => user.addFavorite(new MediaId(mediaId)));
  queue.forEach(mediaId => user.addQueue(new MediaId(mediaId)));
  return user;
};

describe('SequelizeUserRepository', () => {
  test('sync で未指定 models の user / favorite / queue テーブルを初期化できる', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const repository = new SequelizeUserRepository({
      sequelize,
      unitOfWorkContext: new SequelizeUnitOfWork({ sequelize }),
    });

    try {
      await repository.sync();
      const tables = await sequelize.getQueryInterface().showAllTables();
      expect(tables).toEqual(expect.arrayContaining(['user', 'favorite', 'queue']));
    } finally {
      await sequelize.close();
    }
  });

  test('findByUserId は未登録 user_id に対して空の User 集約を返す', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });
    const repository = new SequelizeUserRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await repository.sync();

    try {
      const actual = await repository.findByUserId(new UserId('missing-user'));
      expect(actual.getUserId().getId()).toBe('missing-user');
      expect(actual.getFavorites()).toEqual([]);
      expect(actual.getQueue()).toEqual([]);
    } finally {
      await sequelize.close();
    }
  });

  test('save は既存 user の favorite / queue を空データ更新で置き換える', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });
    const repository = new SequelizeUserRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await repository.sync();

    try {
      await repository.save(createUser({
        favorites: ['media-001', 'media-002'],
        queue: ['media-003'],
      }));
      await repository.save(createUser());

      const actual = await repository.findByUserId(new UserId('user-001'));
      expect(actual.getFavorites()).toEqual([]);
      expect(actual.getQueue()).toEqual([]);
    } finally {
      await sequelize.close();
    }
  });

  test.each([
    ['save', repository => repository.save({})],
    ['findByUserId', repository => repository.findByUserId('user-001')],
  ])('%s は不正引数で例外を送出する', async (_name, run) => {
    const sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const repository = new SequelizeUserRepository({
      sequelize,
      unitOfWorkContext: new SequelizeUnitOfWork({ sequelize }),
    });

    try {
      await repository.sync();
      await expect(run(repository)).rejects.toThrow(Error);
    } finally {
      await sequelize.close();
    }
  });
});
