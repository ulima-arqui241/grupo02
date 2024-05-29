const SandboxedModule = require('sandboxed-module')
const sinon = require('sinon')
const Errors = require('../../../../app/src/Features/Errors/Errors')
const modulePath = require('path').join(
  __dirname,
  '../../../../app/src/Features/ThirdPartyDataStore/TpdsController.js'
)

describe('TpdsController', function () {
  beforeEach(function () {
    this.TpdsUpdateHandler = {}
    this.SessionManager = {
      getLoggedInUserId: sinon.stub().returns('user-id'),
    }
    this.TpdsQueueManager = {
      promises: {
        getQueues: sinon.stub().returns('queues'),
      },
    }
    this.TpdsController = SandboxedModule.require(modulePath, {
      requires: {
        './TpdsUpdateHandler': this.TpdsUpdateHandler,
        './UpdateMerger': (this.UpdateMerger = {}),
        '../Notifications/NotificationsBuilder': (this.NotificationsBuilder = {
          tpdsFileLimit: sinon.stub().returns({ create: sinon.stub() }),
        }),
        '../Authentication/SessionManager': this.SessionManager,
        './TpdsQueueManager': this.TpdsQueueManager,
        '@overleaf/metrics': {
          inc() {},
        },
      },
    })

    this.user_id = 'dsad29jlkjas'
  })

  describe('getting an update', function () {
    it('should process the update with the update receiver', function (done) {
      const path = '/projectName/here.txt'
      const req = {
        pause() {},
        params: { 0: path, user_id: this.user_id },
        session: {
          destroy() {},
        },
        headers: {
          'x-sl-update-source': (this.source = 'dropbox'),
        },
      }
      this.TpdsUpdateHandler.newUpdate = sinon.stub().callsArg(5)
      const res = {
        sendStatus: () => {
          this.TpdsUpdateHandler.newUpdate
            .calledWith(
              this.user_id,
              'projectName',
              '/here.txt',
              req,
              this.source
            )
            .should.equal(true)
          done()
        },
      }
      this.TpdsController.mergeUpdate(req, res)
    })

    it('should return a 500 error when the update receiver fails', function () {
      const path = '/projectName/here.txt'
      const req = {
        pause() {},
        params: { 0: path, user_id: this.user_id },
        session: {
          destroy() {},
        },
        headers: {
          'x-sl-update-source': (this.source = 'dropbox'),
        },
      }
      this.TpdsUpdateHandler.newUpdate = sinon
        .stub()
        .callsArgWith(5, 'update-receiver-error')
      const res = {
        sendStatus: sinon.stub(),
      }
      this.TpdsController.mergeUpdate(req, res)
      res.sendStatus.calledWith(500).should.equal(true)
    })

    it('should return a 400 error when the project is too big', function () {
      const path = '/projectName/here.txt'
      const req = {
        pause() {},
        params: { 0: path, user_id: this.user_id, projectName: 'projectName' },
        session: {
          destroy() {},
        },
        headers: {
          'x-sl-update-source': (this.source = 'dropbox'),
        },
      }
      this.TpdsUpdateHandler.newUpdate = sinon
        .stub()
        .callsArgWith(5, { message: 'project_has_too_many_files' })
      const res = {
        sendStatus: sinon.stub(),
      }
      this.TpdsController.mergeUpdate(req, res)
      res.sendStatus.calledWith(400).should.equal(true)
      this.NotificationsBuilder.tpdsFileLimit
        .calledWith(this.user_id)
        .should.equal(true)
    })

    it('should return a 429 error when the update receiver fails due to too many requests error', function () {
      const path = '/projectName/here.txt'
      const req = {
        pause() {},
        params: { 0: path, user_id: this.user_id },
        session: {
          destroy() {},
        },
        headers: {
          'x-sl-update-source': (this.source = 'dropbox'),
        },
      }
      this.TpdsUpdateHandler.newUpdate = sinon
        .stub()
        .callsArgWith(5, new Errors.TooManyRequestsError('project on cooldown'))
      const res = {
        sendStatus: sinon.stub(),
      }
      this.TpdsController.mergeUpdate(req, res)
      res.sendStatus.calledWith(429).should.equal(true)
    })
  })

  describe('getting a delete update', function () {
    it('should process the delete with the update receiver', function (done) {
      const path = '/projectName/here.txt'
      const req = {
        params: { 0: path, user_id: this.user_id },
        session: {
          destroy() {},
        },
        headers: {
          'x-sl-update-source': (this.source = 'dropbox'),
        },
      }
      this.TpdsUpdateHandler.deleteUpdate = sinon.stub().callsArg(4)
      const res = {
        sendStatus: () => {
          this.TpdsUpdateHandler.deleteUpdate
            .calledWith(this.user_id, 'projectName', '/here.txt', this.source)
            .should.equal(true)
          done()
        },
      }
      this.TpdsController.deleteUpdate(req, res)
    })
  })

  describe('parseParams', function () {
    it('should take the project name off the start and replace with slash', function () {
      const path = 'noSlashHere'
      const req = { params: { 0: path, user_id: this.user_id } }
      const result = this.TpdsController.parseParams(req)
      result.userId.should.equal(this.user_id)
      result.filePath.should.equal('/')
      result.projectName.should.equal(path)
    })

    it('should take the project name off the start and it with no slashes in', function () {
      const path = '/project/file.tex'
      const req = { params: { 0: path, user_id: this.user_id } }
      const result = this.TpdsController.parseParams(req)
      result.userId.should.equal(this.user_id)
      result.filePath.should.equal('/file.tex')
      result.projectName.should.equal('project')
    })

    it('should take the project name of and return a slash for the file path', function () {
      const path = '/project_name'
      const req = { params: { 0: path, user_id: this.user_id } }
      const result = this.TpdsController.parseParams(req)
      result.projectName.should.equal('project_name')
      result.filePath.should.equal('/')
    })
  })

  describe('updateProjectContents', function () {
    beforeEach(function () {
      this.UpdateMerger.mergeUpdate = sinon.stub().callsArg(5)
      this.req = {
        params: {
          0: (this.path = 'chapters/main.tex'),
          project_id: (this.project_id = 'project-id-123'),
        },
        session: {
          destroy: sinon.stub(),
        },
        headers: {
          'x-sl-update-source': (this.source = 'github'),
        },
      }
      this.res = { sendStatus: sinon.stub() }

      this.TpdsController.updateProjectContents(this.req, this.res, this.next)
    })

    it('should merge the update', function () {
      this.UpdateMerger.mergeUpdate
        .calledWith(
          null,
          this.project_id,
          `/${this.path}`,
          this.req,
          this.source
        )
        .should.equal(true)
    })

    it('should return a success', function () {
      this.res.sendStatus.calledWith(200).should.equal(true)
    })
  })

  describe('deleteProjectContents', function () {
    beforeEach(function () {
      this.UpdateMerger.deleteUpdate = sinon.stub().callsArg(4)
      this.req = {
        params: {
          0: (this.path = 'chapters/main.tex'),
          project_id: (this.project_id = 'project-id-123'),
        },
        session: {
          destroy: sinon.stub(),
        },
        headers: {
          'x-sl-update-source': (this.source = 'github'),
        },
      }
      this.res = { sendStatus: sinon.stub() }

      this.TpdsController.deleteProjectContents(this.req, this.res, this.next)
    })

    it('should delete the file', function () {
      this.UpdateMerger.deleteUpdate
        .calledWith(null, this.project_id, `/${this.path}`, this.source)
        .should.equal(true)
    })

    it('should return a success', function () {
      this.res.sendStatus.calledWith(200).should.equal(true)
    })
  })

  describe('getQueues', function () {
    beforeEach(function () {
      this.req = {}
      this.res = { json: sinon.stub() }
      this.next = sinon.stub()
    })

    describe('success', function () {
      beforeEach(async function () {
        await this.TpdsController.getQueues(this.req, this.res, this.next)
      })

      it('should use userId from session', function () {
        this.SessionManager.getLoggedInUserId.should.have.been.calledOnce
        this.TpdsQueueManager.promises.getQueues.should.have.been.calledWith(
          'user-id'
        )
      })

      it('should call json with response', function () {
        this.res.json.should.have.been.calledWith('queues')
        this.next.should.not.have.been.called
      })
    })

    describe('error', function () {
      beforeEach(async function () {
        this.err = new Error()
        this.TpdsQueueManager.promises.getQueues = sinon
          .stub()
          .rejects(this.err)
        await this.TpdsController.getQueues(this.req, this.res, this.next)
      })

      it('should call next with error', function () {
        this.res.json.should.not.have.been.called
        this.next.should.have.been.calledWith(this.err)
      })
    })
  })
})
