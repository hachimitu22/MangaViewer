const Media = require('../../../domain/media/media');
const MediaId = require('../../../domain/media/mediaId');
const Tag = require('../../../domain/media/tag');
const Category = require('../../../domain/media/category');
const Label = require('../../../domain/media/label');


class RegisterMediaServiceInput {
  title;                // タイトル : string
  contents;             // コンテンツ一覧 : array<string>
  tags;                 // タグ一覧 : array<TagInput>
  priorityCategories;   // カテゴリー優先度 : array < string >
  constructor({
    title,
    contents,
    tags,
    priorityCategories,
  }) {
    this.title = title || '';
    this.contents = contents || [];
    this.tags = tags || [];
    this.priorityCategories = priorityCategories || [];
  }
}

class RegisterMediaServiceOutput {
  mediaId;
  constructor({ mediaId }) {
    this.mediaId = mediaId || '';
  }
}

class RegisterMediaService {
  #idGenerator;
  #mediaRepository;
  constructor({ idGenerator, mediaRepository }) {
    this.#idGenerator = idGenerator;
    this.#mediaRepository = mediaRepository;
  }
  async execute(input) {
    const mediaId = new MediaId(this.#idGenerator.generate());
    const title = input.title;
    const contents = input.contents;

    const media = new Media(mediaId, title, contents);
    input.tags.forEach(tag => {
      const category = new Category(tag.category);
      const label = new Label(tag.label);
      try {
        media.addTag(new Tag(category, label));
      } catch (e) {
        // nop
      }
    });
    const priorityCategories = input.priorityCategories.map(category => new Category(category));
    media.setPriorityCategories(priorityCategories);
    await this.#mediaRepository.save(media);

    const output = new RegisterMediaServiceOutput({ mediaId: mediaId.getId() });

    return output;
  }
}

module.exports = {
  input: RegisterMediaServiceInput,
  output: RegisterMediaServiceOutput,
  service: RegisterMediaService,
};
