const Media = require('../../../domain/media/media');
const MediaId = require('../../../domain/media/mediaId');
const MediaTitle = require('../../../domain/media/mediaTitle');
const Tag = require('../../../domain/media/tag');
const Category = require('../../../domain/media/category');
const Label = require('../../../domain/media/label');

class RegisterMediaServiceInput {
  constructor({ title, contents, tags, priorityCategories }) {
    this.title = title;
    this.contents = contents;
    this.tags = tags;
    this.priorityCategories = priorityCategories;
  }
}

class RegisterMediaServiceOutput {
  constructor({ mediaId }) {
    this.mediaId = mediaId;
  }
}

class RegisterMediaService {
  #mediaIdValueGenerator;
  #mediaRepository;

  constructor({ mediaIdValueGenerator, mediaRepository }) {
    if (!mediaIdValueGenerator || typeof mediaIdValueGenerator.generate !== 'function') {
      throw new Error();
    }

    this.#mediaIdValueGenerator = mediaIdValueGenerator;
    this.#mediaRepository = mediaRepository;
  }

  async execute(input) {
    if (!(input instanceof RegisterMediaServiceInput)) {
      throw new Error();
    }

    const mediaId = new MediaId(this.#mediaIdValueGenerator.generate());
    const mediaTitle = new MediaTitle(input.title);
    const tags = input.tags.map(t =>
      new Tag(new Category(t.category), new Label(t.label))
    );
    const priorityCategories = input.priorityCategories.map(
      c => new Category(c)
    );

    const media = new Media(
      mediaId,
      mediaTitle,
      input.contents,
      tags,
      priorityCategories
    );

    await this.#mediaRepository.save(media);

    return new RegisterMediaServiceOutput({
      mediaId: mediaId.getId(),
    });
  }
}

module.exports = {
  RegisterMediaServiceInput,
  RegisterMediaServiceOutput,
  RegisterMediaService,
};
