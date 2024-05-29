const sinon = require('sinon')
const { expect } = require('chai')
const { ObjectId } = require('mongodb')
const SandboxedModule = require('sandboxed-module')
const { User } = require('../helpers/models/User')

const MODULE_PATH = '../../../../app/src/Features/User/UserAuditLogHandler'

describe('UserAuditLogHandler', function () {
  beforeEach(function () {
    this.userId = ObjectId()
    this.initiatorId = ObjectId()
    this.action = {
      operation: 'clear-sessions',
      initiatorId: this.initiatorId,
      info: {
        sessions: [
          {
            ip_address: '0:0:0:0',
            session_created: '2020-07-15T16:07:57.652Z',
          },
        ],
      },
      ip: '0:0:0:0',
    }
    this.UserMock = sinon.mock(User)
    this.UserAuditLogHandler = SandboxedModule.require(MODULE_PATH, {
      requires: {
        '../../models/User': { User },
      },
    })
  })

  afterEach(function () {
    this.UserMock.restore()
  })

  describe('addEntry', function () {
    describe('success', function () {
      beforeEach(function () {
        this.dbUpdate = this.UserMock.expects('updateOne')
          .chain('exec')
          .resolves({ nModified: 1 })
      })
      it('writes a log', async function () {
        await this.UserAuditLogHandler.promises.addEntry(
          this.userId,
          this.action.operation,
          this.action.initiatorId,
          this.action.ip,
          this.action.info
        )
        this.UserMock.verify()
      })

      it('updates the log for password reset operation witout a initiatorId', async function () {
        await expect(
          this.UserAuditLogHandler.promises.addEntry(
            this.userId,
            'reset-password',
            undefined,
            this.action.ip,
            this.action.info
          )
        )
        this.UserMock.verify()
      })
    })

    describe('errors', function () {
      describe('when the user does not exist', function () {
        beforeEach(function () {
          this.UserMock.expects('updateOne')
            .chain('exec')
            .resolves({ nModified: 0 })
        })

        it('throws an error', async function () {
          await expect(
            this.UserAuditLogHandler.promises.addEntry(
              this.userId,
              this.action.operation,
              this.action.initiatorId,
              this.action.ip,
              this.action.info
            )
          ).to.be.rejected
        })
      })

      describe('missing parameters', function () {
        it('throws an error when no operation', async function () {
          await expect(
            this.UserAuditLogHandler.promises.addEntry(
              this.userId,
              undefined,
              this.action.initiatorId,
              this.action.ip,
              this.action.info
            )
          ).to.be.rejected
        })

        it('throws an error when no IP', async function () {
          await expect(
            this.UserAuditLogHandler.promises.addEntry(
              this.userId,
              this.action.operation,
              this.action.initiatorId,
              undefined,
              this.action.info
            )
          ).to.be.rejected
        })

        it('throws an error when no initiatorId and not a password reset operation', async function () {
          await expect(
            this.UserAuditLogHandler.promises.addEntry(
              this.userId,
              this.action.operation,
              undefined,
              this.action.ip,
              this.action.info
            )
          ).to.be.rejected
        })
      })
    })
  })
})
