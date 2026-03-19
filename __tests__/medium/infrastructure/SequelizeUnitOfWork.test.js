const SequelizeUnitOfWork = require('../../../src/infrastructure/SequelizeUnitOfWork');

describe('SequelizeUnitOfWork', () => {
  test('run で開始した実行文脈内では getCurrent でトランザクションを取得できる', async () => {
    const executionScope = { id: 'tx-1' };
    const sequelize = {
      transaction: async work => work(executionScope),
    };
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });

    await unitOfWork.run(async () => {
      expect(unitOfWork.getCurrent()).toBe(executionScope);
    });
  });

  test('run 実行文脈の外では getCurrent は null を返す', async () => {
    const sequelize = {
      transaction: async work => work({ id: 'tx-1' }),
    };
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });

    expect(unitOfWork.getCurrent()).toBeNull();

    await unitOfWork.run(async () => {
      expect(unitOfWork.getCurrent()).not.toBeNull();
    });

    expect(unitOfWork.getCurrent()).toBeNull();
  });

  test('run 内で例外が発生した場合は rollback され例外が再送出される', async () => {
    const state = { committed: false, rolledBack: false };
    const sequelize = {
      transaction: async work => {
        const executionScope = { id: 'tx-1' };

        try {
          const result = await work(executionScope);
          state.committed = true;
          return result;
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

    expect(state.committed).toBe(false);
    expect(state.rolledBack).toBe(true);
  });

  test('constructor は transaction 関数を持たない sequelize を受け取ると例外を送出する', () => {
    expect(() => new SequelizeUnitOfWork({ sequelize: {} })).toThrow(Error);
  });

  test('run は関数以外の引数を受け取ると例外を送出する', async () => {
    const sequelize = {
      transaction: async work => work({ id: 'tx-1' }),
    };
    const unitOfWork = new SequelizeUnitOfWork({ sequelize });

    await expect(unitOfWork.run('not-function')).rejects.toThrow(Error);
  });
});
