const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const LogoutPostController = require('../../api/LogoutPostController');

const setRouterApiLogout = ({ router, authResolver, logoutService } = {}) => {
  const auth = new SessionAuthMiddleware(authResolver);
  const controller = new LogoutPostController({ logoutService });

  router.post('/api/logout', auth.execute.bind(auth), controller.execute.bind(controller));
};

module.exports = setRouterApiLogout;
