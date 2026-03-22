const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const {
  Input,
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
} = require('../../../application/media/query/GetMediaContentWithNavigationService');
const {
  createContentPublicPath,
} = require('../../../presentation/content/contentAssetPaths');

const parsePage = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const setRouterScreenViewerGet = ({
  router,
  authResolver,
  getMediaContentWithNavigationService,
}) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/viewer/:mediaId/:mediaPage', ...[
    auth.execute.bind(auth),
    async (req, res, next) => {
      try {
        const mediaPage = parsePage(req.params.mediaPage);
        if (mediaPage === null) {
          res.status(404).render('screen/error', {
            pageTitle: 'エラーが発生しました',
          });
          return;
        }

        const result = await getMediaContentWithNavigationService.execute(new Input({
          mediaId: req.params.mediaId,
          contentPosition: mediaPage,
        }));

        if (result instanceof MediaNotFoundResult || result instanceof ContentNotFoundResult) {
          res.status(404).render('screen/error', {
            pageTitle: 'エラーが発生しました',
          });
          return;
        }

        if (!(result instanceof FoundResult)) {
          throw new Error('viewer result is invalid');
        }

        res.status(200).render('screen/viewer', {
          pageTitle: `ビューアー ${req.params.mediaId} - ${mediaPage}ページ`,
          viewer: {
            mediaId: req.params.mediaId,
            mediaPage,
            contentUrl: createContentPublicPath(result.contentId),
            previousPageUrl: result.previousContentId ? `/screen/viewer/${req.params.mediaId}/${mediaPage - 1}` : null,
            nextPageUrl: result.nextContentId ? `/screen/viewer/${req.params.mediaId}/${mediaPage + 1}` : null,
            detailUrl: `/screen/detail/${req.params.mediaId}`,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ]);
};

module.exports = setRouterScreenViewerGet;
module.exports.parsePage = parsePage;
