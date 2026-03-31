const path = require('path');

const { Sequelize, DataTypes } = require('sequelize');

const { hashPassword } = require('../src/infrastructure/auth/fixedUserPasswordHasher');

const PRODUCTION_GUARD_MESSAGE = '固定認証情報の本番利用禁止: production環境では固定ユーザーseedを実行できません。';

const createDatabaseStoragePath = source => source.DATABASE_STORAGE_PATH
  || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite');

const validateFixedUserEnv = source => {
  const userId = source.FIXED_LOGIN_USER_ID || source.LOGIN_USER_ID || '';
  const username = source.FIXED_LOGIN_USERNAME || source.LOGIN_USERNAME || '';
  const password = source.FIXED_LOGIN_PASSWORD || source.LOGIN_PASSWORD || '';

  if (typeof userId !== 'string' || userId.length === 0) {
    throw new Error('FIXED_LOGIN_USER_ID (または LOGIN_USER_ID) を設定してください。');
  }
  if (typeof username !== 'string' || username.length === 0) {
    throw new Error('FIXED_LOGIN_USERNAME (または LOGIN_USERNAME) を設定してください。');
  }
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('FIXED_LOGIN_PASSWORD (または LOGIN_PASSWORD) を設定してください。');
  }

  return {
    userId,
    username,
    password,
  };
};

const seedFixedUser = async (source = process.env) => {
  if (source.NODE_ENV === 'production') {
    throw new Error(PRODUCTION_GUARD_MESSAGE);
  }

  const databaseStoragePath = createDatabaseStoragePath(source);
  const { userId, username, password } = validateFixedUserEnv(source);

  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: databaseStoragePath,
    logging: false,
  });

  const UserModel = sequelize.define('user', {
    user_id: { type: DataTypes.STRING, primaryKey: true },
  }, { tableName: 'user', timestamps: false });

  const FixedCredentialModel = sequelize.define('fixed_login_credential', {
    user_id: { type: DataTypes.STRING, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
  }, { tableName: 'fixed_login_credential', timestamps: false });

  try {
    await sequelize.sync();

    let userResult = '既存スキップ';
    const existingUser = await UserModel.findByPk(userId);
    if (!existingUser) {
      await UserModel.create({ user_id: userId });
      userResult = '作成';
    }

    const passwordHash = hashPassword(password);
    let credentialResult = '既存スキップ';

    const existingByUserId = await FixedCredentialModel.findByPk(userId);
    const existingByUsername = await FixedCredentialModel.findOne({ where: { username } });

    if (existingByUsername && existingByUsername.user_id !== userId) {
      throw new Error(`username=${username} は別ユーザーIDで使用済みです。`);
    }

    if (!existingByUserId) {
      await FixedCredentialModel.create({
        user_id: userId,
        username,
        password_hash: passwordHash,
      });
      credentialResult = '作成';
    } else {
      const shouldUpdate = existingByUserId.username !== username || existingByUserId.password_hash !== passwordHash;
      if (shouldUpdate) {
        await FixedCredentialModel.update(
          {
            username,
            password_hash: passwordHash,
          },
          { where: { user_id: userId } },
        );
        credentialResult = '限定更新';
      }
    }

    console.log(`[seed:user] user:${userResult} userId=${userId}`);
    console.log(`[seed:user] credential:${credentialResult} userId=${userId} username=${username}`);
    return {
      userResult,
      credentialResult,
    };
  } catch (error) {
    console.error('[seed:user] 失敗', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  seedFixedUser().catch(() => {
    process.exit(1);
  });
}

module.exports = {
  PRODUCTION_GUARD_MESSAGE,
  seedFixedUser,
};
