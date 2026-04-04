const { Input } = require('../../application/media/query/GetMediaDetailService');
const { toPublicContentPath } = require('./publicContentPath');

class ScreenDetailGetController {
  #getMediaDetailService;

  constructor({ getMediaDetailService }) {
    if (!getMediaDetailService || typeof getMediaDetailService.execute !== 'function') {
      throw new Error('getMediaDetailService.execute must be a function');
    }

    this.#getMediaDetailService = getMediaDetailService;
  }

  async execute(req, res) {
    try {
      const result = await this.#getMediaDetailService.execute(new Input({
        mediaId: req.params.mediaId,
      }));
      const mediaDetail = {
        ...result.mediaDetail,
        contents: result.mediaDetail.contents.map(content => ({
          ...content,
          thumbnail: toPublicContentPath(content.thumbnail),
        })),
      };

      return res.status(200).render('screen/detail', {
        pageTitle: `${mediaDetail.title} の詳細`,
        mediaDetail,
        currentPath: '/screen/detail',
        currentUserId: req.context?.userId || null,
      });
    } catch (_error) {
      return res.redirect(301, '/screen/error');
    }
  }
}

module.exports = ScreenDetailGetController;
