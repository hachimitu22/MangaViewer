const BasePuppeteerEnvironment = require('jest-environment-puppeteer')

const PuppeteerEnvironment = BasePuppeteerEnvironment.default || BasePuppeteerEnvironment

const defineAlias = (name, resolver) => {
  if (typeof Object.prototype[name] === 'function') {
    return
  }

  Object.defineProperty(Object.prototype, name, {
    value: function alias(...args) {
      const target = resolver(this)

      if (typeof target === 'function') {
        return target.apply(this, args)
      }

      return this
    },
    configurable: true,
    writable: true,
    enumerable: false,
  })
}

const patchEventAliases = () => {
  defineAlias('addListener', value => value.on || value.addEventListener)
  defineAlias('removeListener', value => value.off || value.removeEventListener)
}

class PatchedPuppeteerEnvironment extends PuppeteerEnvironment {
  constructor(config, context) {
    patchEventAliases()
    super(config, context)
  }
}

module.exports = PatchedPuppeteerEnvironment
