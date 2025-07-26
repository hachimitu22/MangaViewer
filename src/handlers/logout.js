
module.exports = (req, res) => {
  res.setHeader('Set-Cookie', `session_token=; HttpOnly; Path=/; Max-Age=0`);
  res.redirect('/');
};