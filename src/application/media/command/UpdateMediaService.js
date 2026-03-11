const Media = require('../../../domain/media/media');
const MediaId = require('../../../domain/media/mediaId');
const MediaTitle = require('../../../domain/media/mediaTitle');
const ContentId = require('../../../domain/media/contentId');
const Tag = require('../../../domain/media/tag');
const Category = require('../../../domain/media/category');
const Label = require('../../../domain/media/label');

class UpdateMediaServiceInput {
  constructor({ id, title, contents, tags, priorityCategories }) {
    this.id = id;
    this.title = title;
    this.contents = contents;
    this.tags = tags;
    this.priorityCategories = priorityCategories;
  }
}

class UpdateMediaService {
  #mediaRepository;
  #unitOfWork;

  constructor({ mediaRepository, unitOfWork }) {
    if (!mediaRepository || typeof mediaRepository.save !== 'function' || typeof mediaRepository.findByMediaId !== 'function') {
      throw new Error();
    }

    if (!unitOfWork || typeof unitOfWork.run !== 'function') {
      throw new Error();
    }

    this.#mediaRepository = mediaRepository;
    this.#unitOfWork = unitOfWork;
  }

  async execute(input) {
    if (!(input instanceof UpdateMediaServiceInput)) {
      throw new Error();
    }

    return this.#unitOfWork.run(async () => {
      // メディア取得
    const mediaId = new MediaId(input.id);
    const media = await this.#mediaRepository.findByMediaId(mediaId);

    // メディア更新
    const mediaTitle = new MediaTitle(input.title);
    const contents = input.contents.map(c => new ContentId(c));
    const tags = input.tags.map(t =>
      new Tag(new Category(t.category), new Label(t.label))
    );
    const priorityCategories = input.priorityCategories.map(
      c => new Category(c)
    );
    media.changeTitle(mediaTitle);
    media.changeContents(contents);
    media.changeTags(tags);
    media.changePriorityCategories(priorityCategories);

    // メディア上書き
      await this.#mediaRepository.save(media);
    });
  }
}

module.exports = {
  UpdateMediaServiceInput,
  UpdateMediaService,
};
