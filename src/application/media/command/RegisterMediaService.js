const Media = require('../../../domain/media/media');
const MediaId = require('../../../domain/media/mediaId');
const MediaTitle = require('../../../domain/media/mediaTitle');
const ContentId = require('../../../domain/media/contentId');
const Tag = require('../../../domain/media/tag');
const Category = require('../../../domain/media/category');
const Label = require('../../../domain/media/label');
const normalizeTextInput = value => (typeof value === 'string' ? value.trim() : value);

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
  #unitOfWork;

  constructor({ mediaIdValueGenerator, mediaRepository, unitOfWork }) {
    if (!mediaIdValueGenerator || typeof mediaIdValueGenerator.generate !== 'function') {
      throw new Error();
    }
    if (!mediaRepository || typeof mediaRepository.save !== 'function') {
      throw new Error();
    }

    if (!unitOfWork || typeof unitOfWork.run !== 'function') {
      throw new Error();
    }

    this.#mediaIdValueGenerator = mediaIdValueGenerator;
    this.#mediaRepository = mediaRepository;
    this.#unitOfWork = unitOfWork;
  }

  async execute(input) {
    if (!(input instanceof RegisterMediaServiceInput)) {
      throw new Error();
    }

    return this.#unitOfWork.run(async () => {
      const mediaId = new MediaId(this.#mediaIdValueGenerator.generate());
      const mediaTitle = new MediaTitle(normalizeTextInput(input.title));
      const contents = input.contents.map(c => new ContentId(c));
      const tags = input.tags.map(t =>
        new Tag(
          new Category(normalizeTextInput(t.category)),
          new Label(normalizeTextInput(t.label))
        )
      );
      const priorityCategories = input.priorityCategories.map(
        c => new Category(normalizeTextInput(c))
      );

      const media = new Media(
        mediaId,
        mediaTitle,
        contents,
        tags,
        priorityCategories
      );

      await this.#mediaRepository.save(media);

      return new RegisterMediaServiceOutput({
        mediaId: mediaId.getId(),
      });
    });
  }
}

module.exports = {
  RegisterMediaServiceInput,
  RegisterMediaServiceOutput,
  RegisterMediaService,
};
