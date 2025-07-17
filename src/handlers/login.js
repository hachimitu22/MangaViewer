const canLogin = (id, password) => {
  return id && password;
};

const createSessionToken = (id, password) => {
  return 'token';
};

module.exports = (req, res) => {
  const { id, password } = req.body;
  if (canLogin(id, password)) {
    const token = createSessionToken(id, password);
    res.setHeader('Set-Cookie', `session_token=${token}; HttpOnly; Max-Age=3600;`)
    res.redirect('/list');
  } else {
    res.redirect('/');
  }
};