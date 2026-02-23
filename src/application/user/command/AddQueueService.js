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
class NotFoundMediaResult extends Result {
  constructor() {
    super();
  }
}
class AlreadyAddedResult extends Result {
  constructor() {
    super();
  }
}
class QueueAddedResult extends Result {
  constructor() {
    super();
  }
}


class AddQueueService {
  #mediaRepository;
  #userRepository;

  constructor({ mediaRepository, userRepository }) {
    if (!mediaRepository || typeof mediaRepository.findByMediaId !== 'function') {
      throw new Error();
    }
    if (!userRepository || typeof userRepository.findByUserId !== 'function') {
      throw new Error();
    }
    if (!userRepository || typeof userRepository.save !== 'function') {
      throw new Error();
    }

    this.#mediaRepository = mediaRepository;
    this.#userRepository = userRepository;
  }

  async execute(query) {
    if (!(query instanceof Query)) {
      throw new Error();
    }

    // ユーザー存在チェック
    const userId = new UserId(query.userId);
    const user = await this.#userRepository.findByUserId(userId);
    if (user === null) {
      return new NotFoundUserResult();
    }

    // メディア存在チェック
    const mediaId = new MediaId(query.mediaId);
    const media = await this.#mediaRepository.findByMediaId(mediaId);
    if (media === null) {
      return new NotFoundMediaResult();
    }

    // お気に入り追加
    try {
      user.addQueue(mediaId);
    } catch (e) {
      return new AlreadyAddedResult();
    }

    // ユーザー更新
    await this.#userRepository.save(user);

    return new QueueAddedResult();
  }
}

module.exports = {
  Query,
  NotFoundUserResult,
  NotFoundMediaResult,
  AlreadyAddedResult,
  QueueAddedResult,
  AddQueueService,
};
