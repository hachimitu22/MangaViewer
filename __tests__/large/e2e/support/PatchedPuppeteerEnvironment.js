const BasePuppeteerEnvironment = require('jest-environment-puppeteer')

const PuppeteerEnvironment = BasePuppeteerEnvironment.default || BasePuppeteerEnvironment

const patchPagePrototype = () => {
  const packageNames = ['puppeteer', 'puppeteer-core']

  packageNames.forEach(packageName => {
    try {
      const loaded = require(packageName)
      const puppeteer = loaded.default || loaded
      const PageClass = puppeteer && puppeteer.Page

      if (!PageClass || !PageClass.prototype) {
        return
      }

      if (typeof PageClass.prototype.addListener !== 'function' && typeof PageClass.prototype.on === 'function') {
        PageClass.prototype.addListener = PageClass.prototype.on
      }

      if (typeof PageClass.prototype.removeListener !== 'function' && typeof PageClass.prototype.off === 'function') {
        PageClass.prototype.removeListener = PageClass.prototype.off
      }
    } catch (_error) {
      // ignore: package may not be resolvable in this execution context
    }
  })
}

class PatchedPuppeteerEnvironment extends PuppeteerEnvironment {
  constructor(config, context) {
    patchPagePrototype()
    super(config, context)
  }

  async setup() {
    await super.setup()

    const page = this.global && this.global.page

    if (page && typeof page.addListener !== 'function' && typeof page.on === 'function') {
      page.addListener = page.on.bind(page)
    }

    if (page && typeof page.removeListener !== 'function' && typeof page.off === 'function') {
      page.removeListener = page.off.bind(page)
    }
  }

  async teardown() {
    const page = this.global && this.global.page

    if (page && typeof page.removeListener !== 'function' && typeof page.off === 'function') {
      page.removeListener = page.off.bind(page)
    }

    await super.teardown()
  }
}

module.exports = PatchedPuppeteerEnvironment
