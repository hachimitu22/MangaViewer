if (global.page && typeof global.page.removeListener !== 'function' && typeof global.page.off === 'function') {
  global.page.removeListener = global.page.off.bind(global.page)
}
