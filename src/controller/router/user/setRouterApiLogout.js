const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');
const LogoutPostController = require('../../api/LogoutPostController');

const setRouterApiLogout = ({ router, authResolver, logoutService } = {}) => {
  const auth = new SessionAuthMiddleware(authResolver);
  const csrf = new CsrfProtectionMiddleware();
  const controller = new LogoutPostController({ logoutService });

  router.post('/api/logout', auth.execute.bind(auth), csrf.execute.bind(csrf), controller.execute.bind(controller));
};

module.exports = setRouterApiLogout;
