/* eslint-disable
    camelcase,
    node/handle-callback-err,
    max-len,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { promisify } = require('util')
const { Subscription } = require('../../models/Subscription')
const { DeletedSubscription } = require('../../models/DeletedSubscription')
const logger = require('logger-sharelatex')
require('./GroupPlansData') // make sure dynamic group plans are loaded

const SubscriptionLocator = {
  getUsersSubscription(user_or_id, callback) {
    const user_id = SubscriptionLocator._getUserId(user_or_id)
    return Subscription.findOne(
      { admin_id: user_id },
      function (err, subscription) {
        logger.log({ user_id }, 'got users subscription')
        return callback(err, subscription)
      }
    )
  },

  getUserIndividualSubscription(user_or_id, callback) {
    const user_id = SubscriptionLocator._getUserId(user_or_id)
    return Subscription.findOne(
      { admin_id: user_id, groupPlan: false },
      function (err, subscription) {
        logger.log({ user_id }, 'got users individual subscription')
        return callback(err, subscription)
      }
    )
  },

  getManagedGroupSubscriptions(user_or_id, callback) {
    if (callback == null) {
      callback = function (error, managedSubscriptions) {}
    }
    const user_id = SubscriptionLocator._getUserId(user_or_id)
    return Subscription.find({
      manager_ids: user_or_id,
      groupPlan: true,
    })
      .populate('admin_id')
      .exec(callback)
  },

  getMemberSubscriptions(user_or_id, callback) {
    const user_id = SubscriptionLocator._getUserId(user_or_id)
    return Subscription.find({ member_ids: user_id })
      .populate('admin_id')
      .exec(callback)
  },

  getSubscription(subscription_id, callback) {
    return Subscription.findOne({ _id: subscription_id }, callback)
  },

  getSubscriptionByMemberIdAndId(user_id, subscription_id, callback) {
    return Subscription.findOne(
      { member_ids: user_id, _id: subscription_id },
      { _id: 1 },
      callback
    )
  },

  getGroupSubscriptionsMemberOf(user_id, callback) {
    return Subscription.find(
      { member_ids: user_id },
      { _id: 1, planCode: 1 },
      callback
    )
  },

  getGroupsWithEmailInvite(email, callback) {
    return Subscription.find({ invited_emails: email }, callback)
  },

  getGroupWithV1Id(v1TeamId, callback) {
    return Subscription.findOne({ 'overleaf.id': v1TeamId }, callback)
  },

  getUserDeletedSubscriptions(userId, callback) {
    DeletedSubscription.find({ 'subscription.admin_id': userId }, callback)
  },

  getDeletedSubscription(subscriptionId, callback) {
    DeletedSubscription.findOne(
      {
        'subscription._id': subscriptionId,
      },
      callback
    )
  },

  _getUserId(user_or_id) {
    if (user_or_id != null && user_or_id._id != null) {
      return user_or_id._id
    } else if (user_or_id != null) {
      return user_or_id
    }
  },
}

SubscriptionLocator.promises = {
  getUsersSubscription: promisify(SubscriptionLocator.getUsersSubscription),
  getUserIndividualSubscription: promisify(
    SubscriptionLocator.getUserIndividualSubscription
  ),
  getManagedGroupSubscriptions: promisify(
    SubscriptionLocator.getManagedGroupSubscriptions
  ),
  getMemberSubscriptions: promisify(SubscriptionLocator.getMemberSubscriptions),
  getSubscription: promisify(SubscriptionLocator.getSubscription),
  getSubscriptionByMemberIdAndId: promisify(
    SubscriptionLocator.getSubscriptionByMemberIdAndId
  ),
  getGroupSubscriptionsMemberOf: promisify(
    SubscriptionLocator.getGroupSubscriptionsMemberOf
  ),
  getGroupsWithEmailInvite: promisify(
    SubscriptionLocator.getGroupsWithEmailInvite
  ),
  getGroupWithV1Id: promisify(SubscriptionLocator.getGroupWithV1Id),
  getUserDeletedSubscriptions: promisify(
    SubscriptionLocator.getUserDeletedSubscriptions
  ),
  getDeletedSubscription: promisify(SubscriptionLocator.getDeletedSubscription),
}
module.exports = SubscriptionLocator
