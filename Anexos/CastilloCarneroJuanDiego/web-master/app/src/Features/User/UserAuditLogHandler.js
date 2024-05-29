const OError = require('@overleaf/o-error')
const { User } = require('../../models/User')
const { callbackify } = require('util')

const MAX_AUDIT_LOG_ENTRIES = 200

function _canHaveNoInitiatorId(operation, info) {
  if (operation === 'reset-password') return true
  if (operation === 'unlink-sso' && info.providerId === 'collabratec')
    return true
}

/**
 * Add an audit log entry
 *
 * The entry should include at least the following fields:
 *
 * - userId: the user on behalf of whom the operation was performed
 * - operation: a string identifying the type of operation
 * - initiatorId: who performed the operation
 * - ipAddress: the IP address of the initiator
 * - info: an object detailing what happened
 */
async function addEntry(userId, operation, initiatorId, ipAddress, info = {}) {
  if (!operation || !ipAddress)
    throw new OError('missing required audit log data', {
      operation,
      initiatorId,
      ipAddress,
    })

  if (!initiatorId && !_canHaveNoInitiatorId(operation, info)) {
    throw new OError('missing initiatorId for audit log', {
      operation,
      ipAddress,
    })
  }

  const timestamp = new Date()
  const entry = {
    operation,
    initiatorId,
    info,
    ipAddress,
    timestamp,
  }
  const result = await User.updateOne(
    { _id: userId },
    {
      $push: {
        auditLog: { $each: [entry], $slice: -MAX_AUDIT_LOG_ENTRIES },
      },
    }
  ).exec()
  if (result.nModified === 0) {
    throw new OError('user not found', { userId })
  }
}

const UserAuditLogHandler = {
  addEntry: callbackify(addEntry),
  promises: {
    addEntry,
  },
}

module.exports = UserAuditLogHandler
