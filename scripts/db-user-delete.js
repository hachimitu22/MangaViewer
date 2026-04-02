const path = require('path');

const { Sequelize, DataTypes } = require('sequelize');

const createDatabaseStoragePath = source => source.DATABASE_STORAGE_PATH
  || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite');

const printUsage = () => {
  console.log('使い方: npm run db:user:delete -- <userId>');
  console.log('例: npm run db:user:delete -- admin');
};

const deleteUser = async (argv = process.argv.slice(2), source = process.env) => {
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
    const deletedCount = await UserModel.destroy({
      where: { user_id: normalizedUserId },
    });

    if (deletedCount > 0) {
      console.log(`[db:user:delete] 削除しました userId=${normalizedUserId}`);
      return true;
    }

    console.log(`[db:user:delete] 対象が存在しません userId=${normalizedUserId}`);
    return false;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  deleteUser().catch(error => {
    console.error('[db:user:delete] 失敗', error.message);
    process.exit(1);
  });
}

module.exports = {
  deleteUser,
  createDatabaseStoragePath,
};
