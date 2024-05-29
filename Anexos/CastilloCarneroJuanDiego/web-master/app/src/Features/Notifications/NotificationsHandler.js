const settings = require('@overleaf/settings')
const request = require('request')
const logger = require('logger-sharelatex')
const _ = require('lodash')

const notificationsApi = _.get(settings, ['apis', 'notifications', 'url'])
const oneSecond = 1000

const makeRequest = function (opts, callback) {
  if (notificationsApi) {
    request(opts, callback)
  } else {
    callback(null, { statusCode: 200 })
  }
}

module.exports = {
  getUserNotifications(userId, callback) {
    const opts = {
      uri: `${notificationsApi}/user/${userId}`,
      json: true,
      timeout: oneSecond,
      method: 'GET',
    }
    makeRequest(opts, function (err, res, unreadNotifications) {
      const statusCode = res ? res.statusCode : 500
      if (err || statusCode !== 200) {
        logger.err(
          { err, statusCode },
          'something went wrong getting notifications'
        )
        callback(null, [])
      } else {
        if (unreadNotifications == null) {
          unreadNotifications = []
        }
        callback(null, unreadNotifications)
      }
    })
  },

  createNotification(
    userId,
    key,
    templateKey,
    messageOpts,
    expiryDateTime,
    forceCreate,
    callback
  ) {
    if (!callback) {
      callback = forceCreate
      forceCreate = true
    }
    const payload = {
      key,
      messageOpts,
      templateKey,
      forceCreate,
    }
    if (expiryDateTime) {
      payload.expires = expiryDateTime
    }
    const opts = {
      uri: `${notificationsApi}/user/${userId}`,
      timeout: oneSecond,
      method: 'POST',
      json: payload,
    }
    makeRequest(opts, callback)
  },

  markAsReadWithKey(userId, key, callback) {
    const opts = {
      uri: `${notificationsApi}/user/${userId}`,
      method: 'DELETE',
      timeout: oneSecond,
      json: {
        key,
      },
    }
    makeRequest(opts, callback)
  },

  markAsRead(userId, notificationId, callback) {
    const opts = {
      method: 'DELETE',
      uri: `${notificationsApi}/user/${userId}/notification/${notificationId}`,
      timeout: oneSecond,
    }
    makeRequest(opts, callback)
  },

  // removes notification by key, without regard for user_id,
  // should not be exposed to user via ui/router
  markAsReadByKeyOnly(key, callback) {
    const opts = {
      uri: `${notificationsApi}/key/${key}`,
      method: 'DELETE',
      timeout: oneSecond,
    }
    makeRequest(opts, callback)
  },
}
