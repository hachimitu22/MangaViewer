const BasePuppeteerEnvironment = require('jest-environment-puppeteer')

const PuppeteerEnvironment = BasePuppeteerEnvironment.default || BasePuppeteerEnvironment

class PatchedPuppeteerEnvironment extends PuppeteerEnvironment {
  async teardown() {
    const page = this.global && this.global.page

    if (page && typeof page.removeListener !== 'function' && typeof page.off === 'function') {
      page.removeListener = page.off.bind(page)
    }

    await super.teardown()
  }
}

module.exports = PatchedPuppeteerEnvironment
