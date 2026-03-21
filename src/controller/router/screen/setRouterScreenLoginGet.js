const setRouterScreenLoginGet = ({
  router,
}) => {
  router.get('/screen/login', (_req, res) => {
    res.status(200).render('screen/login', {
      pageTitle: 'ログイン',
      formAction: '/api/login',
      usernameLabel: 'ユーザー名',
      passwordLabel: 'パスワード',
      submitLabel: 'ログイン',
    });
  });
};

module.exports = setRouterScreenLoginGet;
