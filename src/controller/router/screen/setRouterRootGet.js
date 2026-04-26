const setRouterRootGet = ({ router }) => {
  router.get('/', (_req, res) => {
    res.redirect('/screen/summary');
  });
};

module.exports = setRouterRootGet;
