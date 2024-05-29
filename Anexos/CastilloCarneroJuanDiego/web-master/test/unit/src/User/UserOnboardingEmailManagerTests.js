const SandboxedModule = require('sandboxed-module')
const path = require('path')
const sinon = require('sinon')
const { expect } = require('chai')

const MODULE_PATH = path.join(
  __dirname,
  '../../../../app/src/Features/User/UserOnboardingEmailManager'
)

describe('UserOnboardingEmailManager', function () {
  beforeEach(function () {
    this.fakeUserId = '123abc'
    this.fakeUserEmail = 'frog@overleaf.com'
    this.onboardingEmailsQueue = {
      add: sinon.stub().resolves(),
      process: callback => {
        this.queueProcessFunction = callback
      },
    }
    this.Queues = {
      getOnboardingEmailsQueue: sinon
        .stub()
        .returns(this.onboardingEmailsQueue),
    }
    this.UserGetter = {
      promises: {
        getUser: sinon.stub().resolves({
          _id: this.fakeUserId,
          email: this.fakeUserEmail,
        }),
      },
    }
    this.EmailHandler = {
      promises: {
        sendEmail: sinon.stub().resolves(),
      },
    }
    this.UserUpdater = {
      promises: {
        updateUser: sinon.stub().resolves(),
      },
    }
    this.Features = {
      hasFeature: sinon.stub(),
    }
    this.request = sinon.stub().yields()

    this.init = isSAAS => {
      this.Features.hasFeature.withArgs('saas').returns(isSAAS)
      this.UserOnboardingEmailManager = SandboxedModule.require(MODULE_PATH, {
        globals: {
          console: console,
        },
        requires: {
          '../../infrastructure/Features': this.Features,
          '../../infrastructure/Queues': this.Queues,
          '../Email/EmailHandler': this.EmailHandler,
          './UserGetter': this.UserGetter,
          './UserUpdater': this.UserUpdater,
        },
      })
    }
  })

  describe('in Server CE/Pro', function () {
    beforeEach(function () {
      this.init(false)
    })

    it('should not create any queue', function () {
      expect(this.Queues.getOnboardingEmailsQueue).to.not.have.been.called
    })
    it('should not schedule any email', function () {
      this.UserOnboardingEmailManager.scheduleOnboardingEmail({
        _id: this.fakeUserId,
      })
      expect(this.onboardingEmailsQueue.add).to.not.have.been.called
    })
  })

  describe('schedule email in SAAS', function () {
    beforeEach(function () {
      this.init(true)
    })

    it('should schedule delayed job on queue', function () {
      this.UserOnboardingEmailManager.scheduleOnboardingEmail({
        _id: this.fakeUserId,
      })
      sinon.assert.calledWith(
        this.onboardingEmailsQueue.add,
        { userId: this.fakeUserId },
        { delay: 24 * 60 * 60 * 1000 }
      )
    })

    it('queue process callback should send onboarding email and update user', async function () {
      await this.queueProcessFunction({ data: { userId: this.fakeUserId } })
      sinon.assert.calledWith(
        this.UserGetter.promises.getUser,
        { _id: this.fakeUserId },
        { email: 1 }
      )
      sinon.assert.calledWith(
        this.EmailHandler.promises.sendEmail,
        'userOnboardingEmail',
        {
          to: this.fakeUserEmail,
        }
      )
      sinon.assert.calledWith(
        this.UserUpdater.promises.updateUser,
        this.fakeUserId,
        {
          $set: { onboardingEmailSentAt: sinon.match.date },
        }
      )
    })

    it('queue process callback should stop if user is not found', async function () {
      this.UserGetter.promises.getUser = sinon.stub().resolves()
      await this.queueProcessFunction({ data: { userId: 'deleted-user' } })
      sinon.assert.calledWith(
        this.UserGetter.promises.getUser,
        { _id: 'deleted-user' },
        { email: 1 }
      )
      sinon.assert.notCalled(this.EmailHandler.promises.sendEmail)
      sinon.assert.notCalled(this.UserUpdater.promises.updateUser)
    })
  })
})
