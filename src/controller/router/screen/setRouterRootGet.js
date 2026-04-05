const setRouterRootGet = ({
  router,
  authResolver,
}) => {
  router.get('/', async (req, res) => {
    const sessionToken = req.session?.session_token;

    if (!sessionToken) {
      res.redirect('/screen/login');
      return;
    }

    try {
      const userId = await authResolver.execute(sessionToken);

      if (!userId) {
        res.redirect('/screen/login');
        return;
      }

      res.redirect('/screen/summary');
    } catch (_error) {
      res.redirect('/screen/login');
    }
  });
};

module.exports = setRouterRootGet;
