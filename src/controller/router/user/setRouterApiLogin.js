const LoginPostController = require('../../api/LoginPostController');
const LoginRateLimiter = require('../../middleware/LoginRateLimiter');
const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');

const setRouterApiLogin = ({
  router,
  loginService,
  loginAttemptStore,
  maxAttemptsPerWindow = 5,
  windowMs = 60_000,
} = {}) => {
  const rateLimiter = new LoginRateLimiter({
    loginAttemptStore,
    maxAttemptsPerWindow,
    windowMs,
  });
  const csrf = new CsrfProtectionMiddleware();
  const controller = new LoginPostController({ loginService, loginAttemptStore });

  router.post('/api/login', rateLimiter.execute.bind(rateLimiter), csrf.execute.bind(csrf), controller.execute.bind(controller));
};

module.exports = setRouterApiLogin;
