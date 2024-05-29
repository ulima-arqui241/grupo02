const logger = require('logger-sharelatex')
const Settings = require('@overleaf/settings')
const querystring = require('querystring')
const _ = require('lodash')
const Url = require('url')
const Path = require('path')
const moment = require('moment')
const pug = require('pug-runtime')

const IS_DEV_ENV = ['development', 'test'].includes(process.env.NODE_ENV)

const Features = require('./Features')
const SessionManager = require('../Features/Authentication/SessionManager')
const PackageVersions = require('./PackageVersions')
const Modules = require('./Modules')
const SafeHTMLSubstitute = require('../Features/Helpers/SafeHTMLSubstitution')

let webpackManifest
if (!IS_DEV_ENV) {
  // Only load webpack manifest file in production. In dev, the web and webpack
  // containers can't coordinate, so there no guarantee that the manifest file
  // exists when the web server boots. We therefore ignore the manifest file in
  // dev reload
  webpackManifest = require(`../../../public/manifest.json`)
}

const I18N_HTML_INJECTIONS = new Set()

module.exports = function (webRouter, privateApiRouter, publicApiRouter) {
  webRouter.use(function (req, res, next) {
    res.locals.session = req.session
    next()
  })

  function addSetContentDisposition(req, res, next) {
    res.setContentDisposition = function (type, opts) {
      const directives = _.map(
        opts,
        (v, k) => `${k}="${encodeURIComponent(v)}"`
      )
      const contentDispositionValue = `${type}; ${directives.join('; ')}`
      res.setHeader('Content-Disposition', contentDispositionValue)
    }
    next()
  }
  webRouter.use(addSetContentDisposition)
  privateApiRouter.use(addSetContentDisposition)
  publicApiRouter.use(addSetContentDisposition)

  webRouter.use(function (req, res, next) {
    req.externalAuthenticationSystemUsed =
      Features.externalAuthenticationSystemUsed
    res.locals.externalAuthenticationSystemUsed =
      Features.externalAuthenticationSystemUsed
    req.hasFeature = res.locals.hasFeature = Features.hasFeature
    next()
  })

  webRouter.use(function (req, res, next) {
    let staticFilesBase

    const cdnAvailable =
      Settings.cdn && Settings.cdn.web && !!Settings.cdn.web.host
    const cdnBlocked = req.query.nocdn === 'true' || req.session.cdnBlocked
    const userId = SessionManager.getLoggedInUserId(req.session)
    if (cdnBlocked && req.session.cdnBlocked == null) {
      logger.log(
        { user_id: userId, ip: req != null ? req.ip : undefined },
        'cdnBlocked for user, not using it and turning it off for future requets'
      )
      req.session.cdnBlocked = true
    }
    const host = req.headers && req.headers.host
    const isSmoke = host.slice(0, 5).toLowerCase() === 'smoke'
    if (cdnAvailable && !isSmoke && !cdnBlocked) {
      staticFilesBase = Settings.cdn.web.host
    } else {
      staticFilesBase = ''
    }

    res.locals.buildBaseAssetPath = function () {
      // Return the base asset path (including the CDN url) so that webpack can
      // use this to dynamically fetch scripts (e.g. PDFjs worker)
      return Url.resolve(staticFilesBase, '/')
    }

    res.locals.buildJsPath = function (jsFile) {
      let path
      if (IS_DEV_ENV) {
        // In dev: resolve path within JS asset directory
        // We are *not* guaranteed to have a manifest file when the server
        // starts up
        path = Path.join('/js', jsFile)
      } else {
        // In production: resolve path from webpack manifest file
        // We are guaranteed to have a manifest file since webpack compiles in
        // the build
        path = `/${webpackManifest[jsFile]}`
      }

      return Url.resolve(staticFilesBase, path)
    }

    // Temporary hack while jQuery/Angular dependencies are *not* bundled,
    // instead copied into output directory
    res.locals.buildCopiedJsAssetPath = function (jsFile) {
      let path
      if (IS_DEV_ENV) {
        // In dev: resolve path to root directory
        // We are *not* guaranteed to have a manifest file when the server
        // starts up
        path = Path.join('/', jsFile)
      } else {
        // In production: resolve path from webpack manifest file
        // We are guaranteed to have a manifest file since webpack compiles in
        // the build
        path = `/${webpackManifest[jsFile]}`
      }

      return Url.resolve(staticFilesBase, path)
    }

    res.locals.mathJaxPath = `/js/libs/mathjax/MathJax.js?${querystring.stringify(
      {
        config: 'TeX-AMS_HTML,Safe',
        v: require('mathjax/package.json').version,
      }
    )}`

    res.locals.lib = PackageVersions.lib

    res.locals.moment = moment

    const IEEE_BRAND_ID = 15
    res.locals.isIEEE = brandVariation =>
      (brandVariation != null ? brandVariation.brand_id : undefined) ===
      IEEE_BRAND_ID

    res.locals.getCssThemeModifier = function (userSettings, brandVariation) {
      // Themes only exist in OL v2
      if (Settings.overleaf != null) {
        // The IEEE theme takes precedence over the user personal setting, i.e. a user with
        // a theme setting of "light" will still get the IEE theme in IEEE branded projects.
        if (res.locals.isIEEE(brandVariation)) {
          return 'ieee-'
        } else if (userSettings && userSettings.overallTheme != null) {
          return userSettings.overallTheme
        }
      }
    }

    res.locals.buildStylesheetPath = function (cssFileName) {
      let path
      if (IS_DEV_ENV) {
        // In dev: resolve path within CSS asset directory
        // We are *not* guaranteed to have a manifest file when the server
        // starts up
        path = Path.join('/stylesheets/', cssFileName)
      } else {
        // In production: resolve path from webpack manifest file
        // We are guaranteed to have a manifest file since webpack compiles in
        // the build
        path = `/${webpackManifest[cssFileName]}`
      }

      return Url.resolve(staticFilesBase, path)
    }

    res.locals.buildCssPath = function (themeModifier = '') {
      return res.locals.buildStylesheetPath(`${themeModifier}style.css`)
    }

    res.locals.buildImgPath = function (imgFile) {
      const path = Path.join('/img/', imgFile)
      return Url.resolve(staticFilesBase, path)
    }

    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.translate = function (key, vars, components) {
      vars = vars || {}

      if (Settings.i18n.checkForHTMLInVars) {
        Object.entries(vars).forEach(([field, value]) => {
          if (pug.escape(value) !== value) {
            const violationsKey = key + field
            // do not flood the logs, log one sample per pod + key + field
            if (!I18N_HTML_INJECTIONS.has(violationsKey)) {
              logger.warn(
                { key, field, value },
                'html content in translations context vars'
              )
              I18N_HTML_INJECTIONS.add(violationsKey)
            }
          }
        })
      }

      vars.appName = Settings.appName
      const locale = req.i18n.translate(key, vars)
      if (components) {
        return SafeHTMLSubstitute.render(locale, components)
      } else {
        return locale
      }
    }
    // Don't include the query string parameters, otherwise Google
    // treats ?nocdn=true as the canonical version
    const parsedOriginalUrl = Url.parse(req.originalUrl)
    res.locals.currentUrl = parsedOriginalUrl.pathname
    res.locals.currentUrlWithQueryParams = parsedOriginalUrl.path
    res.locals.capitalize = function (string) {
      if (string.length === 0) {
        return ''
      }
      return string.charAt(0).toUpperCase() + string.slice(1)
    }
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.getUserEmail = function () {
      const user = SessionManager.getSessionUser(req.session)
      const email = (user != null ? user.email : undefined) || ''
      return email
    }
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.StringHelper = require('../Features/Helpers/StringHelper')
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.buildReferalUrl = function (referalMedium) {
      let url = Settings.siteUrl
      const currentUser = SessionManager.getSessionUser(req.session)
      if (
        currentUser != null &&
        (currentUser != null ? currentUser.referal_id : undefined) != null
      ) {
        url += `?r=${currentUser.referal_id}&rm=${referalMedium}&rs=b` // Referal source = bonus
      }
      return url
    }
    res.locals.getReferalId = function () {
      const currentUser = SessionManager.getSessionUser(req.session)
      if (
        currentUser != null &&
        (currentUser != null ? currentUser.referal_id : undefined) != null
      ) {
        return currentUser.referal_id
      }
    }
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.csrfToken = req != null ? req.csrfToken() : undefined
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.gaToken =
      Settings.analytics && Settings.analytics.ga && Settings.analytics.ga.token
    res.locals.gaOptimizeId = _.get(Settings, ['analytics', 'gaOptimize', 'id'])
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.getReqQueryParam = field =>
      req.query != null ? req.query[field] : undefined
    next()
  })

  webRouter.use(function (req, res, next) {
    const currentUser = SessionManager.getSessionUser(req.session)
    if (currentUser != null) {
      res.locals.user = {
        email: currentUser.email,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
      }
    }
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.getLoggedInUserId = () =>
      SessionManager.getLoggedInUserId(req.session)
    res.locals.getSessionUser = () => SessionManager.getSessionUser(req.session)
    next()
  })

  webRouter.use(function (req, res, next) {
    // Clone the nav settings so they can be modified for each request
    res.locals.nav = {}
    for (const key in Settings.nav) {
      res.locals.nav[key] = _.clone(Settings.nav[key])
    }
    res.locals.templates = Settings.templateLinks
    next()
  })

  webRouter.use(function (req, res, next) {
    if (Settings.reloadModuleViewsOnEachRequest) {
      Modules.loadViewIncludes()
    }
    res.locals.moduleIncludes = Modules.moduleIncludes
    res.locals.moduleIncludesAvailable = Modules.moduleIncludesAvailable
    next()
  })

  webRouter.use(function (req, res, next) {
    // TODO
    if (Settings.overleaf != null) {
      res.locals.overallThemes = [
        {
          name: 'Default',
          val: '',
          path: res.locals.buildCssPath(),
        },
        {
          name: 'Light',
          val: 'light-',
          path: res.locals.buildCssPath('light-'),
        },
      ]
    }
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.settings = Settings
    next()
  })

  webRouter.use(function (req, res, next) {
    res.locals.ExposedSettings = {
      isOverleaf: Settings.overleaf != null,
      appName: Settings.appName,
      hasSamlBeta: req.session.samlBeta,
      hasSamlFeature: Features.hasFeature('saml'),
      samlInitPath: _.get(Settings, ['saml', 'ukamf', 'initPath']),
      hasLinkUrlFeature: Features.hasFeature('link-url'),
      hasLinkedProjectFileFeature: Features.hasFeature('linked-project-file'),
      hasLinkedProjectOutputFileFeature: Features.hasFeature(
        'linked-project-output-file'
      ),
      siteUrl: Settings.siteUrl,
      emailConfirmationDisabled: Settings.emailConfirmationDisabled,
      maxEntitiesPerProject: Settings.maxEntitiesPerProject,
      maxUploadSize: Settings.maxUploadSize,
      recaptchaSiteKeyV3:
        Settings.recaptcha != null ? Settings.recaptcha.siteKeyV3 : undefined,
      recaptchaDisabled:
        Settings.recaptcha != null ? Settings.recaptcha.disabled : undefined,
      textExtensions: Settings.textExtensions,
      validRootDocExtensions: Settings.validRootDocExtensions,
      sentryAllowedOriginRegex: Settings.sentry.allowedOriginRegex,
      sentryDsn: Settings.sentry.publicDSN,
      sentryEnvironment: Settings.sentry.environment,
      sentryRelease: Settings.sentry.release,
      enableSubscriptions: Settings.enableSubscriptions,
    }
    next()
  })
}
