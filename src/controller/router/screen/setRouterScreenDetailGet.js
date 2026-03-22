const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const { Input } = require('../../../application/media/query/GetMediaDetailService');

const setRouterScreenDetailGet = ({ router, authResolver, getMediaDetailService }) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/detail/:mediaId', ...[
    auth.execute.bind(auth),
    async (req, res, next) => {
      try {
        const result = await getMediaDetailService.execute(new Input({
          mediaId: req.params.mediaId,
        }));

        res.status(200).render('screen/detail', {
          pageTitle: `${result.mediaDetail.title} の詳細`,
          mediaDetail: result.mediaDetail,
        });
      } catch (error) {
        next(error);
      }
    },
  ]);
};

module.exports = setRouterScreenDetailGet;
