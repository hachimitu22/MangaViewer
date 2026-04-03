const { Input } = require('../../application/media/query/GetMediaDetailService');

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

      return res.status(200).render('screen/detail', {
        pageTitle: `${result.mediaDetail.title} の詳細`,
        mediaDetail: result.mediaDetail,
        currentPath: '/screen/detail',
        currentUserId: req.context?.userId || null,
      });
    } catch (_error) {
      return res.redirect(301, '/screen/error');
    }
  }
}

module.exports = ScreenDetailGetController;
