const path = require('path');

const { Sequelize, DataTypes } = require('sequelize');

const createDatabaseStoragePath = source => source.DATABASE_STORAGE_PATH
  || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite');

const listUsers = async (source = process.env) => {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: createDatabaseStoragePath(source),
    logging: false,
  });

  const UserModel = sequelize.define('user', {
    user_id: { type: DataTypes.STRING, primaryKey: true },
  }, { tableName: 'user', timestamps: false });

  try {
    await sequelize.sync();
    const users = await UserModel.findAll({
      attributes: ['user_id'],
      order: [['user_id', 'ASC']],
    });

    if (users.length === 0) {
      console.log('[db:user:list] ユーザーは登録されていません');
      return [];
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.user_id}`);
    });
    return users.map(user => user.user_id);
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  listUsers().catch(error => {
    console.error('[db:user:list] 失敗', error.message);
    process.exit(1);
  });
}

module.exports = {
  listUsers,
  createDatabaseStoragePath,
};
