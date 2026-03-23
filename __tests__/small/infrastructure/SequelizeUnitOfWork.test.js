const SequelizeUnitOfWork = require('../../../src/infrastructure/SequelizeUnitOfWork');

describe('SequelizeUnitOfWork', () => {
  test('run は callback の戻り値を返し非同期境界をまたいでも getCurrent を維持する', async () => {
    const executionScope = { id: 'tx-1' };
    const sequelize = {
      transaction: async work => work(executionScope),
    };
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });

    const result = await unitOfWork.run(async () => {
      await Promise.resolve();
      expect(unitOfWork.getCurrent()).toBe(executionScope);
      return 'done';
    });

    expect(result).toBe('done');
    expect(unitOfWork.getCurrent()).toBeNull();
  });

  test('run 内例外は sequelize.transaction へ伝播し rollback 側の分岐を通す', async () => {
    const state = { rolledBack: false };
    const sequelize = {
      transaction: async work => {
        try {
          return await work({ id: 'tx-1' });
        } catch (error) {
          state.rolledBack = true;
          throw error;
        }
      },
    };
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });

    await expect(unitOfWork.run(async () => {
      throw new Error('rollback');
    })).rejects.toThrow('rollback');
    expect(state.rolledBack).toBe(true);
  });

  test('constructor / run は不正入力で例外を送出する', async () => {
    expect(() => new SequelizeUnitOfWork({ sequelize: {} })).toThrow(Error);

    const unitOfWork = new SequelizeUnitOfWork({
      sequelize: { transaction: async work => work({ id: 'tx-1' }) },
    });

    await expect(unitOfWork.run(null)).rejects.toThrow(Error);
  });
});
