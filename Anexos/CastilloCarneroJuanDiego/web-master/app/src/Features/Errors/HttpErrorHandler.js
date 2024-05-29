const logger = require('logger-sharelatex')
const Settings = require('@overleaf/settings')

function renderJSONError(res, message, info = {}) {
  if (info.message) {
    logger.warn(
      info,
      `http error info shouldn't contain a 'message' field, will be overridden`
    )
  }
  if (message != null) {
    res.json({ ...info, message })
  } else {
    res.json(info)
  }
}

function handleGeneric500Error(req, res, statusCode, message) {
  res.status(statusCode)
  switch (req.accepts(['html', 'json'])) {
    case 'html':
      return res.render('general/500', { title: 'Server Error' })
    case 'json':
      return renderJSONError(res, message)
    default:
      return res.send('internal server error')
  }
}

function handleGeneric400Error(req, res, statusCode, message, info = {}) {
  res.status(statusCode)
  switch (req.accepts(['html', 'json'])) {
    case 'html':
      return res.render('general/400', {
        title: 'Client Error',
        message: message,
      })
    case 'json':
      return renderJSONError(res, message, info)
    default:
      return res.send('client error')
  }
}

let HttpErrorHandler
module.exports = HttpErrorHandler = {
  handleErrorByStatusCode(req, res, error, statusCode) {
    const is400Error = statusCode >= 400 && statusCode < 500
    const is500Error = statusCode >= 500 && statusCode < 600

    if (is400Error) {
      logger.warn(error)
    } else if (is500Error) {
      logger.error(error)
    }

    if (statusCode === 403) {
      HttpErrorHandler.forbidden(req, res)
    } else if (statusCode === 404) {
      HttpErrorHandler.notFound(req, res)
    } else if (statusCode === 409) {
      HttpErrorHandler.conflict(req, res, '')
    } else if (statusCode === 422) {
      HttpErrorHandler.unprocessableEntity(req, res)
    } else if (is400Error) {
      handleGeneric400Error(req, res, statusCode)
    } else if (is500Error) {
      handleGeneric500Error(req, res, statusCode)
    } else {
      logger.error(
        { err: error, statusCode },
        `unable to handle error with status code ${statusCode}`
      )
      res.sendStatus(500)
    }
  },

  badRequest(req, res, message, info = {}) {
    handleGeneric400Error(req, res, 400, message, info)
  },

  conflict(req, res, message, info = {}) {
    res.status(409)
    switch (req.accepts(['html', 'json'])) {
      case 'html':
        return res.render('general/400', {
          title: 'Client Error',
          message: message,
        })
      case 'json':
        return renderJSONError(res, message, info)
      default:
        return res.send('conflict')
    }
  },

  forbidden(req, res, message = 'restricted', info = {}) {
    res.status(403)
    switch (req.accepts(['html', 'json'])) {
      case 'html':
        return res.render('user/restricted', { title: 'restricted' })
      case 'json':
        return renderJSONError(res, message, info)
      default:
        return res.send('restricted')
    }
  },

  notFound(req, res, message = 'not found', info = {}) {
    res.status(404)
    switch (req.accepts(['html', 'json'])) {
      case 'html':
        return res.render('general/404', { title: 'page_not_found' })
      case 'json':
        return renderJSONError(res, message, info)
      default:
        return res.send('not found')
    }
  },

  unprocessableEntity(req, res, message = 'unprocessable entity', info = {}) {
    res.status(422)
    switch (req.accepts(['html', 'json'])) {
      case 'html':
        return res.render('general/400', {
          title: 'Client Error',
          message: message,
        })
      case 'json':
        return renderJSONError(res, message, info)
      default:
        return res.send('unprocessable entity')
    }
  },

  legacyInternal(req, res, message, error) {
    logger.error(error)
    handleGeneric500Error(req, res, 500, message)
  },

  maintenance(req, res) {
    // load balancer health checks require a success response for /
    if (req.url === '/') {
      res.status(200)
    } else {
      res.status(503)
    }
    let message = `${Settings.appName} is currently down for maintenance.`
    if (Settings.statusPageUrl) {
      message += ` Please check https://${Settings.statusPageUrl} for updates.`
    }
    switch (req.accepts(['html', 'json'])) {
      case 'html':
        return res.render('general/closed', { title: 'maintenance' })
      case 'json':
        return renderJSONError(res, message, {})
      default:
        return res.send(message)
    }
  },
}
