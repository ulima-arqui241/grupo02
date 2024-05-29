const logger = require('logger-sharelatex')
const OError = require('@overleaf/o-error')
const AnalyticsRegistrationSourceHelper = require('./AnalyticsRegistrationSourceHelper')
const SessionManager = require('../../Features/Authentication/SessionManager')

function setSource(source) {
  return function (req, res, next) {
    if (req.session) {
      req.session.required_login_for = source
    }
    next()
  }
}

function clearSource() {
  return function (req, res, next) {
    AnalyticsRegistrationSourceHelper.clearSource(req.session)
    next()
  }
}

function setInbound() {
  return function setInbound(req, res, next) {
    if (req.session.inbound) {
      return next() // don't overwrite referrer
    }

    if (SessionManager.isUserLoggedIn(req.session)) {
      return next() // don't store referrer if user is alread logged in
    }

    const referrer = req.header('referrer')
    try {
      AnalyticsRegistrationSourceHelper.setInbound(
        req.session,
        req.url,
        req.query,
        referrer
      )
    } catch (error) {
      // log errors and fail silently
      OError.tag(error, 'failed to parse inbound referrer', {
        referrer,
      })
      logger.warn({ error }, error.message)
    }
    next()
  }
}

module.exports = {
  setSource,
  clearSource,
  setInbound,
}
