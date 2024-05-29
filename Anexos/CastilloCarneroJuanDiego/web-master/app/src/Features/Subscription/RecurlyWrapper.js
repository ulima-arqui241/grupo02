/* eslint-disable
    camelcase,
    node/handle-callback-err,
    max-len,
    no-unused-vars,
    node/no-deprecated-api,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const OError = require('@overleaf/o-error')
const querystring = require('querystring')
const crypto = require('crypto')
const request = require('request')
const Settings = require('@overleaf/settings')
const xml2js = require('xml2js')
const logger = require('logger-sharelatex')
const Async = require('async')
const Errors = require('../Errors/Errors')
const SubscriptionErrors = require('./Errors')
const { promisify } = require('util')

function updateAccountEmailAddress(accountId, newEmail, callback) {
  const data = {
    email: newEmail,
  }
  const requestBody = RecurlyWrapper._buildXml('account', data)

  RecurlyWrapper.apiRequest(
    {
      url: `accounts/${accountId}`,
      method: 'PUT',
      body: requestBody,
    },
    (error, response, body) => {
      if (error != null) {
        return callback(error)
      }
      RecurlyWrapper._parseAccountXml(body, callback)
    }
  )
}

const RecurlyWrapper = {
  apiUrl: Settings.apis.recurly.url || 'https://api.recurly.com/v2',

  _paypal: {
    checkAccountExists(cache, next) {
      const { user } = cache
      const { subscriptionDetails } = cache
      logger.log(
        { user_id: user._id },
        'checking if recurly account exists for user'
      )
      return RecurlyWrapper.apiRequest(
        {
          url: `accounts/${user._id}`,
          method: 'GET',
          expect404: true,
        },
        function (error, response, responseBody) {
          if (error) {
            OError.tag(
              error,
              'error response from recurly while checking account',
              {
                user_id: user._id,
              }
            )
            return next(error)
          }
          if (response.statusCode === 404) {
            // actually not an error in this case, just no existing account
            logger.log(
              { user_id: user._id },
              'user does not currently exist in recurly, proceed'
            )
            cache.userExists = false
            return next(null, cache)
          }
          logger.log({ user_id: user._id }, 'user appears to exist in recurly')
          return RecurlyWrapper._parseAccountXml(
            responseBody,
            function (err, account) {
              if (err) {
                OError.tag(err, 'error parsing account', {
                  user_id: user._id,
                })
                return next(err)
              }
              cache.userExists = true
              cache.account = account
              return next(null, cache)
            }
          )
        }
      )
    },
    createAccount(cache, next) {
      const { user } = cache
      const { subscriptionDetails } = cache
      if (cache.userExists) {
        return next(null, cache)
      }

      let address
      try {
        address = getAddressFromSubscriptionDetails(subscriptionDetails, false)
      } catch (error) {
        return next(error)
      }
      const data = {
        account_code: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        address,
      }
      const requestBody = RecurlyWrapper._buildXml('account', data)

      return RecurlyWrapper.apiRequest(
        {
          url: 'accounts',
          method: 'POST',
          body: requestBody,
        },
        (error, response, responseBody) => {
          if (error) {
            OError.tag(
              error,
              'error response from recurly while creating account',
              {
                user_id: user._id,
              }
            )
            return next(error)
          }
          return RecurlyWrapper._parseAccountXml(
            responseBody,
            function (err, account) {
              if (err) {
                OError.tag(err, 'error creating account', {
                  user_id: user._id,
                })
                return next(err)
              }
              cache.account = account
              return next(null, cache)
            }
          )
        }
      )
    },
    createBillingInfo(cache, next) {
      const { user } = cache
      const { recurlyTokenIds } = cache
      const { subscriptionDetails } = cache
      logger.log({ user_id: user._id }, 'creating billing info in recurly')
      const accountCode = __guard__(
        cache != null ? cache.account : undefined,
        x1 => x1.account_code
      )
      if (!accountCode) {
        return next(new Error('no account code at createBillingInfo stage'))
      }
      const data = { token_id: recurlyTokenIds.billing }
      const requestBody = RecurlyWrapper._buildXml('billing_info', data)
      return RecurlyWrapper.apiRequest(
        {
          url: `accounts/${accountCode}/billing_info`,
          method: 'POST',
          body: requestBody,
        },
        (error, response, responseBody) => {
          if (error) {
            OError.tag(
              error,
              'error response from recurly while creating billing info',
              {
                user_id: user._id,
              }
            )
            return next(error)
          }
          return RecurlyWrapper._parseBillingInfoXml(
            responseBody,
            function (err, billingInfo) {
              if (err) {
                OError.tag(err, 'error creating billing info', {
                  user_id: user._id,
                  accountCode,
                })
                return next(err)
              }
              cache.billingInfo = billingInfo
              return next(null, cache)
            }
          )
        }
      )
    },

    setAddressAndCompanyBillingInfo(cache, next) {
      const { user } = cache
      const { subscriptionDetails } = cache
      logger.log(
        { user_id: user._id },
        'setting billing address and company info in recurly'
      )
      const accountCode = __guard__(
        cache != null ? cache.account : undefined,
        x1 => x1.account_code
      )
      if (!accountCode) {
        return next(
          new Error('no account code at setAddressAndCompanyBillingInfo stage')
        )
      }

      let addressAndCompanyBillingInfo
      try {
        addressAndCompanyBillingInfo = getAddressFromSubscriptionDetails(
          subscriptionDetails,
          true
        )
      } catch (error) {
        return next(error)
      }
      const requestBody = RecurlyWrapper._buildXml(
        'billing_info',
        addressAndCompanyBillingInfo
      )

      return RecurlyWrapper.apiRequest(
        {
          url: `accounts/${accountCode}/billing_info`,
          method: 'PUT',
          body: requestBody,
        },
        (error, response, responseBody) => {
          if (error) {
            OError.tag(
              error,
              'error response from recurly while setting address',
              {
                user_id: user._id,
              }
            )
            return next(error)
          }
          return RecurlyWrapper._parseBillingInfoXml(
            responseBody,
            function (err, billingInfo) {
              if (err) {
                OError.tag(err, 'error updating billing info', {
                  user_id: user._id,
                })
                return next(err)
              }
              cache.billingInfo = billingInfo
              return next(null, cache)
            }
          )
        }
      )
    },
    createSubscription(cache, next) {
      const { user } = cache
      const { subscriptionDetails } = cache
      logger.log({ user_id: user._id }, 'creating subscription in recurly')
      const data = {
        plan_code: subscriptionDetails.plan_code,
        currency: subscriptionDetails.currencyCode,
        coupon_code: subscriptionDetails.coupon_code,
        account: {
          account_code: user._id,
        },
      }
      const customFields = getCustomFieldsFromSubscriptionDetails(
        subscriptionDetails
      )
      if (customFields) {
        data.custom_fields = customFields
      }
      const requestBody = RecurlyWrapper._buildXml('subscription', data)

      return RecurlyWrapper.apiRequest(
        {
          url: 'subscriptions',
          method: 'POST',
          body: requestBody,
        },
        (error, response, responseBody) => {
          if (error) {
            OError.tag(
              error,
              'error response from recurly while creating subscription',
              {
                user_id: user._id,
              }
            )
            return next(error)
          }
          return RecurlyWrapper._parseSubscriptionXml(
            responseBody,
            function (err, subscription) {
              if (err) {
                OError.tag(err, 'error creating subscription', {
                  user_id: user._id,
                })
                return next(err)
              }
              cache.subscription = subscription
              return next(null, cache)
            }
          )
        }
      )
    },
  },

  _createPaypalSubscription(
    user,
    subscriptionDetails,
    recurlyTokenIds,
    callback
  ) {
    logger.log(
      { user_id: user._id },
      'starting process of creating paypal subscription'
    )
    // We use `async.waterfall` to run each of these actions in sequence
    // passing a `cache` object along the way. The cache is initialized
    // with required data, and `async.apply` to pass the cache to the first function
    const cache = { user, recurlyTokenIds, subscriptionDetails }
    return Async.waterfall(
      [
        Async.apply(RecurlyWrapper._paypal.checkAccountExists, cache),
        RecurlyWrapper._paypal.createAccount,
        RecurlyWrapper._paypal.createBillingInfo,
        RecurlyWrapper._paypal.setAddressAndCompanyBillingInfo,
        RecurlyWrapper._paypal.createSubscription,
      ],
      function (err, result) {
        if (err) {
          OError.tag(err, 'error in paypal subscription creation process', {
            user_id: user._id,
          })
          return callback(err)
        }
        if (!result.subscription) {
          err = new Error('no subscription object in result')
          OError.tag(err, 'error in paypal subscription creation process', {
            user_id: user._id,
          })
          return callback(err)
        }
        logger.log(
          { user_id: user._id },
          'done creating paypal subscription for user'
        )
        return callback(null, result.subscription)
      }
    )
  },

  _createCreditCardSubscription(
    user,
    subscriptionDetails,
    recurlyTokenIds,
    callback
  ) {
    const data = {
      plan_code: subscriptionDetails.plan_code,
      currency: subscriptionDetails.currencyCode,
      coupon_code: subscriptionDetails.coupon_code,
      account: {
        account_code: user._id,
        email: user.email,
        first_name: subscriptionDetails.first_name || user.first_name,
        last_name: subscriptionDetails.last_name || user.last_name,
        billing_info: {
          token_id: recurlyTokenIds.billing,
        },
      },
    }
    if (recurlyTokenIds.threeDSecureActionResult) {
      data.account.billing_info.three_d_secure_action_result_token_id =
        recurlyTokenIds.threeDSecureActionResult
    }
    const customFields = getCustomFieldsFromSubscriptionDetails(
      subscriptionDetails
    )
    if (customFields) {
      data.custom_fields = customFields
    }
    const requestBody = RecurlyWrapper._buildXml('subscription', data)

    return RecurlyWrapper.apiRequest(
      {
        url: 'subscriptions',
        method: 'POST',
        body: requestBody,
        expect422: true,
      },
      (error, response, responseBody) => {
        if (error != null) {
          return callback(error)
        }

        if (response.statusCode === 422) {
          RecurlyWrapper._handle422Response(responseBody, callback)
        } else {
          RecurlyWrapper._parseSubscriptionXml(responseBody, callback)
        }
      }
    )
  },

  createSubscription(user, subscriptionDetails, recurlyTokenIds, callback) {
    const { isPaypal } = subscriptionDetails
    logger.log(
      { user_id: user._id, isPaypal },
      'setting up subscription in recurly'
    )
    const fn = isPaypal
      ? RecurlyWrapper._createPaypalSubscription
      : RecurlyWrapper._createCreditCardSubscription
    return fn(user, subscriptionDetails, recurlyTokenIds, callback)
  },

  apiRequest(options, callback) {
    options.url = RecurlyWrapper.apiUrl + '/' + options.url
    options.headers = {
      Authorization: `Basic ${new Buffer(Settings.apis.recurly.apiKey).toString(
        'base64'
      )}`,
      Accept: 'application/xml',
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Api-Version': Settings.apis.recurly.apiVersion,
    }
    const { expect404, expect422 } = options
    delete options.expect404
    delete options.expect422
    return request(options, function (error, response, body) {
      if (
        error == null &&
        response.statusCode !== 200 &&
        response.statusCode !== 201 &&
        response.statusCode !== 204 &&
        (response.statusCode !== 404 || !expect404) &&
        (response.statusCode !== 422 || !expect422)
      ) {
        logger.warn(
          {
            err: error,
            body,
            options,
            statusCode: response != null ? response.statusCode : undefined,
          },
          'error returned from recurly'
        )
        // TODO: this should be an Error object not a string
        error = `Recurly API returned with status code: ${response.statusCode}`
      }
      return callback(error, response, body)
    })
  },

  getSubscriptions(accountId, callback) {
    return RecurlyWrapper.apiRequest(
      {
        url: `accounts/${accountId}/subscriptions`,
      },
      (error, response, body) => {
        if (error != null) {
          return callback(error)
        }
        return RecurlyWrapper._parseXml(body, callback)
      }
    )
  },

  getSubscription(subscriptionId, options, callback) {
    let url
    if (callback == null) {
      callback = options
    }
    if (!options) {
      options = {}
    }

    if (options.recurlyJsResult) {
      url = `recurly_js/result/${subscriptionId}`
    } else {
      url = `subscriptions/${subscriptionId}`
    }

    return RecurlyWrapper.apiRequest(
      {
        url,
      },
      (error, response, body) => {
        if (error != null) {
          return callback(error)
        }
        return RecurlyWrapper._parseSubscriptionXml(
          body,
          (error, recurlySubscription) => {
            if (error != null) {
              return callback(error)
            }
            if (options.includeAccount) {
              let accountId
              if (
                recurlySubscription.account != null &&
                recurlySubscription.account.url != null
              ) {
                accountId = recurlySubscription.account.url.match(
                  /accounts\/(.*)/
                )[1]
              } else {
                return callback(
                  new Error("I don't understand the response from Recurly")
                )
              }

              return RecurlyWrapper.getAccount(
                accountId,
                function (error, account) {
                  if (error != null) {
                    return callback(error)
                  }
                  recurlySubscription.account = account
                  return callback(null, recurlySubscription)
                }
              )
            } else {
              return callback(null, recurlySubscription)
            }
          }
        )
      }
    )
  },

  getPaginatedEndpoint(resource, queryParams, callback) {
    queryParams.per_page = queryParams.per_page || 200
    let allItems = []
    var getPage = (cursor = null) => {
      const opts = {
        url: resource,
        qs: queryParams,
      }
      if (cursor != null) {
        opts.qs.cursor = cursor
      }
      return RecurlyWrapper.apiRequest(opts, (error, response, body) => {
        if (error != null) {
          return callback(error)
        }
        return RecurlyWrapper._parseXml(body, function (err, data) {
          if (err != null) {
            logger.warn({ err }, 'could not get accoutns')
            callback(err)
          }
          const items = data[resource]
          allItems = allItems.concat(items)
          logger.log(
            `got another ${items.length}, total now ${allItems.length}`
          )
          cursor = __guard__(
            response.headers.link != null
              ? response.headers.link.match(/cursor=([0-9.]+%3A[0-9.]+)&/)
              : undefined,
            x1 => x1[1]
          )
          if (cursor != null) {
            cursor = decodeURIComponent(cursor)
            return getPage(cursor)
          } else {
            return callback(err, allItems)
          }
        })
      })
    }

    return getPage()
  },

  getAccount(accountId, callback) {
    return RecurlyWrapper.apiRequest(
      {
        url: `accounts/${accountId}`,
      },
      (error, response, body) => {
        if (error != null) {
          return callback(error)
        }
        return RecurlyWrapper._parseAccountXml(body, callback)
      }
    )
  },

  updateAccountEmailAddress,

  getAccountActiveCoupons(accountId, callback) {
    return RecurlyWrapper.apiRequest(
      {
        url: `accounts/${accountId}/redemptions`,
      },
      (error, response, body) => {
        if (error != null) {
          return callback(error)
        }
        return RecurlyWrapper._parseRedemptionsXml(
          body,
          function (error, redemptions) {
            if (error != null) {
              return callback(error)
            }
            const activeRedemptions = redemptions.filter(
              redemption => redemption.state === 'active'
            )
            const couponCodes = activeRedemptions.map(
              redemption => redemption.coupon_code
            )
            return Async.map(
              couponCodes,
              RecurlyWrapper.getCoupon,
              function (error, coupons) {
                if (error != null) {
                  return callback(error)
                }
                return callback(null, coupons)
              }
            )
          }
        )
      }
    )
  },

  getCoupon(couponCode, callback) {
    const opts = { url: `coupons/${couponCode}` }
    return RecurlyWrapper.apiRequest(opts, (error, response, body) =>
      RecurlyWrapper._parseCouponXml(body, callback)
    )
  },

  getBillingInfo(accountId, callback) {
    return RecurlyWrapper.apiRequest(
      {
        url: `accounts/${accountId}/billing_info`,
      },
      (error, response, body) => {
        if (error != null) {
          return callback(error)
        }
        return RecurlyWrapper._parseXml(body, callback)
      }
    )
  },

  getAccountPastDueInvoices(accountId, callback) {
    RecurlyWrapper.apiRequest(
      {
        url: `accounts/${accountId}/invoices?state=past_due`,
      },
      (error, response, body) => {
        if (error) {
          return callback(error)
        }
        RecurlyWrapper._parseInvoicesXml(body, callback)
      }
    )
  },

  attemptInvoiceCollection(invoiceId, callback) {
    RecurlyWrapper.apiRequest(
      {
        url: `invoices/${invoiceId}/collect`,
        method: 'put',
      },
      callback
    )
  },

  updateSubscription(subscriptionId, options, callback) {
    logger.log(
      { subscriptionId, options },
      'telling recurly to update subscription'
    )
    const data = {
      plan_code: options.plan_code,
      timeframe: options.timeframe,
    }
    const requestBody = RecurlyWrapper._buildXml('subscription', data)

    return RecurlyWrapper.apiRequest(
      {
        url: `subscriptions/${subscriptionId}`,
        method: 'put',
        body: requestBody,
      },
      (error, response, responseBody) => {
        if (error != null) {
          return callback(error)
        }
        return RecurlyWrapper._parseSubscriptionXml(responseBody, callback)
      }
    )
  },

  createFixedAmmountCoupon(
    coupon_code,
    name,
    currencyCode,
    discount_in_cents,
    plan_code,
    callback
  ) {
    const data = {
      coupon_code,
      name,
      discount_type: 'dollars',
      discount_in_cents: {},
      plan_codes: {
        plan_code,
      },
      applies_to_all_plans: false,
    }
    data.discount_in_cents[currencyCode] = discount_in_cents
    const requestBody = RecurlyWrapper._buildXml('coupon', data)

    logger.log({ coupon_code, requestBody }, 'creating coupon')
    return RecurlyWrapper.apiRequest(
      {
        url: 'coupons',
        method: 'post',
        body: requestBody,
      },
      (error, response, responseBody) => {
        if (error != null) {
          logger.warn({ err: error, coupon_code }, 'error creating coupon')
        }
        return callback(error)
      }
    )
  },

  lookupCoupon(coupon_code, callback) {
    return RecurlyWrapper.apiRequest(
      {
        url: `coupons/${coupon_code}`,
      },
      (error, response, body) => {
        if (error != null) {
          return callback(error)
        }
        return RecurlyWrapper._parseXml(body, callback)
      }
    )
  },

  redeemCoupon(account_code, coupon_code, callback) {
    const data = {
      account_code,
      currency: 'USD',
    }
    const requestBody = RecurlyWrapper._buildXml('redemption', data)

    logger.log(
      { account_code, coupon_code, requestBody },
      'redeeming coupon for user'
    )
    return RecurlyWrapper.apiRequest(
      {
        url: `coupons/${coupon_code}/redeem`,
        method: 'post',
        body: requestBody,
      },
      (error, response, responseBody) => {
        if (error != null) {
          logger.warn(
            { err: error, account_code, coupon_code },
            'error redeeming coupon'
          )
        }
        return callback(error)
      }
    )
  },

  extendTrial(subscriptionId, daysUntilExpire, callback) {
    if (daysUntilExpire == null) {
      daysUntilExpire = 7
    }
    const next_renewal_date = new Date()
    next_renewal_date.setDate(next_renewal_date.getDate() + daysUntilExpire)
    logger.log(
      { subscriptionId, daysUntilExpire },
      'Exending Free trial for user'
    )
    return RecurlyWrapper.apiRequest(
      {
        url: `/subscriptions/${subscriptionId}/postpone?next_renewal_date=${next_renewal_date}&bulk=false`,
        method: 'put',
      },
      (error, response, responseBody) => {
        if (error != null) {
          logger.warn(
            { err: error, subscriptionId, daysUntilExpire },
            'error exending trial'
          )
        }
        return callback(error)
      }
    )
  },

  listAccountActiveSubscriptions(account_id, callback) {
    if (callback == null) {
      callback = function (error, subscriptions) {}
    }
    return RecurlyWrapper.apiRequest(
      {
        url: `accounts/${account_id}/subscriptions`,
        qs: {
          state: 'active',
        },
        expect404: true,
      },
      function (error, response, body) {
        if (error != null) {
          return callback(error)
        }
        if (response.statusCode === 404) {
          return callback(null, [])
        } else {
          return RecurlyWrapper._parseSubscriptionsXml(body, callback)
        }
      }
    )
  },

  _handle422Response(body, callback) {
    RecurlyWrapper._parseErrorsXml(body, (error, data) => {
      if (error) {
        return callback(error)
      }

      let errorData = {}
      if (data.transaction_error) {
        errorData = {
          message: data.transaction_error.merchant_message,
          info: {
            category: data.transaction_error.error_category,
            gatewayCode: data.transaction_error.gateway_error_code,
            public: {
              code: data.transaction_error.error_code,
              message: data.transaction_error.customer_message,
            },
          },
        }
        if (data.transaction_error.three_d_secure_action_token_id) {
          errorData.info.public.threeDSecureActionTokenId =
            data.transaction_error.three_d_secure_action_token_id
        }
      } else if (data.error && data.error._) {
        // fallback for errors that don't have a `transaction_error` field, but
        // instead a `error` field with a message (e.g. VATMOSS errors)
        errorData = {
          info: {
            public: {
              message: data.error._,
            },
          },
        }
      }
      callback(new SubscriptionErrors.RecurlyTransactionError(errorData))
    })
  },
  _parseSubscriptionsXml(xml, callback) {
    return RecurlyWrapper._parseXmlAndGetAttribute(
      xml,
      'subscriptions',
      callback
    )
  },

  _parseSubscriptionXml(xml, callback) {
    return RecurlyWrapper._parseXmlAndGetAttribute(
      xml,
      'subscription',
      callback
    )
  },

  _parseAccountXml(xml, callback) {
    return RecurlyWrapper._parseXmlAndGetAttribute(xml, 'account', callback)
  },

  _parseBillingInfoXml(xml, callback) {
    return RecurlyWrapper._parseXmlAndGetAttribute(
      xml,
      'billing_info',
      callback
    )
  },

  _parseRedemptionsXml(xml, callback) {
    return RecurlyWrapper._parseXmlAndGetAttribute(xml, 'redemptions', callback)
  },

  _parseCouponXml(xml, callback) {
    return RecurlyWrapper._parseXmlAndGetAttribute(xml, 'coupon', callback)
  },

  _parseErrorsXml(xml, callback) {
    return RecurlyWrapper._parseXmlAndGetAttribute(xml, 'errors', callback)
  },

  _parseInvoicesXml(xml, callback) {
    return RecurlyWrapper._parseXmlAndGetAttribute(xml, 'invoices', callback)
  },

  _parseXmlAndGetAttribute(xml, attribute, callback) {
    return RecurlyWrapper._parseXml(xml, function (error, data) {
      if (error != null) {
        return callback(error)
      }
      if (data != null && data[attribute] != null) {
        return callback(null, data[attribute])
      } else {
        return callback(
          new Error("I don't understand the response from Recurly")
        )
      }
    })
  },

  _parseXml(xml, callback) {
    var convertDataTypes = function (data) {
      let key, value
      if (data != null && data.$ != null) {
        if (data.$.nil === 'nil') {
          data = null
        } else if (data.$.href != null) {
          data.url = data.$.href
          delete data.$
        } else if (data.$.type === 'integer') {
          data = parseInt(data._, 10)
        } else if (data.$.type === 'datetime') {
          data = new Date(data._)
        } else if (data.$.type === 'array') {
          delete data.$
          let array = []
          for (key in data) {
            value = data[key]
            if (value instanceof Array) {
              array = array.concat(convertDataTypes(value))
            } else {
              array.push(convertDataTypes(value))
            }
          }
          data = array
        }
      }

      if (data instanceof Array) {
        data = Array.from(data).map(entry => convertDataTypes(entry))
      } else if (typeof data === 'object') {
        for (key in data) {
          value = data[key]
          data[key] = convertDataTypes(value)
        }
      }
      return data
    }

    const parser = new xml2js.Parser({
      explicitRoot: true,
      explicitArray: false,
      emptyTag: '',
    })
    return parser.parseString(xml, function (error, data) {
      if (error != null) {
        return callback(error)
      }
      const result = convertDataTypes(data)
      return callback(null, result)
    })
  },

  _buildXml(rootName, data) {
    const options = {
      headless: true,
      renderOpts: {
        pretty: true,
        indent: '\t',
      },
      rootName,
    }
    const builder = new xml2js.Builder(options)
    return builder.buildObject(data)
  },
}

RecurlyWrapper.promises = {
  updateAccountEmailAddress: promisify(updateAccountEmailAddress),
}

module.exports = RecurlyWrapper

function getCustomFieldsFromSubscriptionDetails(subscriptionDetails) {
  if (!subscriptionDetails.ITMCampaign) {
    return null
  }

  const customFields = [
    {
      name: 'itm_campaign',
      value: subscriptionDetails.ITMCampaign,
    },
  ]
  if (subscriptionDetails.ITMContent) {
    customFields.push({
      name: 'itm_content',
      value: subscriptionDetails.ITMContent,
    })
  }
  return { custom_field: customFields }
}

function getAddressFromSubscriptionDetails(
  subscriptionDetails,
  includeCompanyInfo
) {
  const { address } = subscriptionDetails

  if (!address || !address.country) {
    throw new Errors.InvalidError({
      message: 'Invalid country',
      info: {
        public: {
          message: 'Invalid country',
        },
      },
    })
  }

  const addressObject = {
    address1: address.address1,
    address2: address.address2 || '',
    city: address.city || '',
    state: address.state || '',
    zip: address.zip || '',
    country: address.country,
  }

  if (
    includeCompanyInfo &&
    subscriptionDetails.billing_info &&
    subscriptionDetails.billing_info.company &&
    subscriptionDetails.billing_info.company !== ''
  ) {
    addressObject.company = subscriptionDetails.billing_info.company
    if (
      subscriptionDetails.billing_info.vat_number &&
      subscriptionDetails.billing_info.vat_number !== ''
    ) {
      addressObject.vat_number = subscriptionDetails.billing_info.vat_number
    }
  }

  return addressObject
}

function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null
    ? transform(value)
    : undefined
}
