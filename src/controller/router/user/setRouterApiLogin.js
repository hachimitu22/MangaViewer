const LoginPostController = require('../../api/LoginPostController');

const setRouterApiLogin = ({ router, loginService } = {}) => {
  const controller = new LoginPostController({ loginService });

  router.post('/api/login', controller.execute.bind(controller));
};

module.exports = setRouterApiLogin;
