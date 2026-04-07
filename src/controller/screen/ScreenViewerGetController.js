const {
  Input,
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
} = require('../../application/media/query/GetMediaContentWithNavigationService');
const { toPublicContentPath } = require('./publicContentPath');

class ScreenViewerGetController {
  #getMediaContentWithNavigationService;

  constructor({ getMediaContentWithNavigationService }) {
    if (!getMediaContentWithNavigationService || typeof getMediaContentWithNavigationService.execute !== 'function') {
      throw new Error('getMediaContentWithNavigationService.execute must be a function');
    }

    this.#getMediaContentWithNavigationService = getMediaContentWithNavigationService;
  }

  async execute(req, res) {
    try {
      const mediaPageParam = String(req.params.mediaPage);
      if (!/^[1-9][0-9]*$/.test(mediaPageParam)) {
        return res.redirect(301, '/screen/error');
      }

      const mediaPage = Number(mediaPageParam);
      const result = await this.#getMediaContentWithNavigationService.execute(new Input({
        mediaId: req.params.mediaId,
        contentPosition: mediaPage,
      }));

      if (result instanceof MediaNotFoundResult || result instanceof ContentNotFoundResult) {
        return res.redirect(301, '/screen/error');
      }
      if (!(result instanceof FoundResult)) {
        throw new Error('unexpected result');
      }

      return res.status(200).render('screen/viewer', {
        pageTitle: `ビューアー ${req.params.mediaId} - ${mediaPage}ページ`,
        mediaId: req.params.mediaId,
        mediaPage,
        currentPath: '/screen/viewer',
        currentUserId: req.context?.userId || null,
        content: {
          id: toPublicContentPath(result.contentId),
          type: result.contentType ?? this.#detectContentType(result.contentId),
        },
        previousPage: result.previousContentId === null ? null : {
          mediaId: req.params.mediaId,
          mediaPage: mediaPage - 1,
          contentId: toPublicContentPath(result.previousContentId),
          href: `/screen/viewer/${req.params.mediaId}/${mediaPage - 1}`,
        },
        nextPage: result.nextContentId === null ? null : {
          mediaId: req.params.mediaId,
          mediaPage: mediaPage + 1,
          contentId: toPublicContentPath(result.nextContentId),
          href: `/screen/viewer/${req.params.mediaId}/${mediaPage + 1}`,
        },
      });
    } catch (_error) {
      return res.redirect(301, '/screen/error');
    }
  }

  #detectContentType(contentId) {
    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(contentId)) {
      return 'video';
    }

    return 'image';
  }
}

module.exports = ScreenViewerGetController;
