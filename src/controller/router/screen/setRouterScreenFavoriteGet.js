const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const { Input } = require('../../../application/user/query/GetFavoriteSummariesService');

const setRouterScreenFavoriteGet = ({ router, authResolver, getFavoriteSummariesService }) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/favorite', ...[
    auth.execute.bind(auth),
    async (req, res, next) => {
      try {
        const result = await getFavoriteSummariesService.execute(new Input({
          userId: req.context.userId,
        }));

        res.status(200).render('screen/favorite', {
          pageTitle: 'お気に入り一覧',
          mediaOverviews: result.mediaOverviews,
        });
      } catch (error) {
        next(error);
      }
    },
  ]);
};

module.exports = setRouterScreenFavoriteGet;
