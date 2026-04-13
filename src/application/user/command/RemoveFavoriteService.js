const MediaId = require('../../../domain/media/mediaId');
const UserId = require('../../../domain/user/userId');

class Query {
  constructor({ mediaId, userId }) {
    if (typeof mediaId !== 'string') {
      throw new Error();
    }
    if (typeof userId !== 'string') {
      throw new Error();
    }

    this.mediaId = mediaId;
    this.userId = userId;
  }
}

class Result {
  constructor() {}
}
class NotFoundUserResult extends Result {
  constructor() {
    super();
  }
}
class NotAddedMediaResult extends Result {
  constructor() {
    super();
  }
}
class FavoriteRemovedResult extends Result {
  constructor() {
    super();
  }
}


class RemoveFavoriteService {
  #userRepository;
  #unitOfWork;

  constructor({ userRepository, unitOfWork }) {
    if (!userRepository || typeof userRepository.findByUserId !== 'function') {
      throw new Error();
    }
    if (!userRepository || typeof userRepository.save !== 'function') {
      throw new Error();
    }

    if (!unitOfWork || typeof unitOfWork.run !== 'function') {
      throw new Error();
    }

    this.#userRepository = userRepository;
    this.#unitOfWork = unitOfWork;
  }

  async execute(query) {
    if (!(query instanceof Query)) {
      throw new Error();
    }

    return this.#unitOfWork.run(async () => {
      // ユーザー存在チェック
    const userId = new UserId(query.userId);
    const user = await this.#userRepository.findByUserId(userId);
    if (user === null) {
      return new NotFoundUserResult();
    }

    // お気に入り削除
    try {
      user.removeFavorite(new MediaId(query.mediaId));
    } catch (e) {
      return new NotAddedMediaResult();
    }

    // ユーザー更新
    await this.#userRepository.save(user);

      return new FavoriteRemovedResult();
    });
  }
}

module.exports = {
  Query,
  NotFoundUserResult,
  NotAddedMediaResult,
  FavoriteRemovedResult,
  RemoveFavoriteService,
};
