const path = require('path');

const { Sequelize, DataTypes } = require('sequelize');

const createDatabaseStoragePath = source => source.DATABASE_STORAGE_PATH
  || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite');

const printUsage = () => {
  console.log('使い方: npm run db:user:add -- <userId>');
  console.log('例: npm run db:user:add -- admin');
};

const addUser = async (argv = process.argv.slice(2), source = process.env) => {
  const [userId] = argv;

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    printUsage();
    return false;
  }

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
    const normalizedUserId = userId.trim();
    const [record, created] = await UserModel.findOrCreate({
      where: { user_id: normalizedUserId },
      defaults: { user_id: normalizedUserId },
    });

    if (created) {
      console.log(`[db:user:add] 作成しました userId=${record.user_id}`);
    } else {
      console.log(`[db:user:add] 既に存在します userId=${record.user_id}`);
    }

    return created;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  addUser().catch(error => {
    console.error('[db:user:add] 失敗', error.message);
    process.exit(1);
  });
}

module.exports = {
  addUser,
  createDatabaseStoragePath,
};
