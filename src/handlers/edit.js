const items = require('../repositories/items');


module.exports = (req, res) => {
  const itemId = req.params && parseInt(req.params.id) || null;
  if (!itemId) {
    return res.redirect('/');
  }

  const item = items.getItem(itemId);
  if (!item) {
    return res.redirect('/');
  }

  res.render('pages/edit', {
    ...item,
  });
};