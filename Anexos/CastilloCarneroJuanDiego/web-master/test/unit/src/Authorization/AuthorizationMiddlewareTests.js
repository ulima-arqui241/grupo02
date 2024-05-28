const sinon = require('sinon')
const { expect } = require('chai')
const SandboxedModule = require('sandboxed-module')
const Errors = require('../../../../app/src/Features/Errors/Errors.js')

const MODULE_PATH =
  '../../../../app/src/Features/Authorization/AuthorizationMiddleware.js'

describe('AuthorizationMiddleware', function () {
  beforeEach(function () {
    this.userId = 'user-id-123'
    this.project_id = 'project-id-123'
    this.token = 'some-token'
    this.AuthenticationController = {}
    this.SessionManager = {
      getLoggedInUserId: sinon.stub().returns(this.userId),
      isUserLoggedIn: sinon.stub().returns(true),
    }
    this.AuthorizationManager = {}
    this.HttpErrorHandler = {
      forbidden: sinon.stub(),
    }
    this.TokenAccessHandler = {
      getRequestToken: sinon.stub().returns(this.token),
    }
    this.ObjectId = {
      isValid: sinon.stub().withArgs(this.project_id).returns(true),
    }
    this.AuthorizationManager = {}
    this.AuthorizationMiddleware = SandboxedModule.require(MODULE_PATH, {
      requires: {
        './AuthorizationManager': this.AuthorizationManager,
        mongodb: {
          ObjectId: this.ObjectId,
        },
        '../Errors/HttpErrorHandler': this.HttpErrorHandler,
        '../Authentication/AuthenticationController': this
          .AuthenticationController,
        '../Authentication/SessionManager': this.SessionManager,
        '../TokenAccess/TokenAccessHandler': this.TokenAccessHandler,
      },
    })
    this.req = {}
    this.res = {}
    this.next = sinon.stub()
  })

  describe('_getUserId', function () {
    beforeEach(function () {
      this.req = {}
    })

    it('should get the user from session', function (done) {
      this.SessionManager.getLoggedInUserId = sinon.stub().returns('1234')
      this.AuthorizationMiddleware._getUserId(this.req, (err, userId) => {
        expect(err).to.not.exist
        expect(userId).to.equal('1234')
        done()
      })
    })

    it('should get oauth_user from request', function (done) {
      this.SessionManager.getLoggedInUserId = sinon.stub().returns(null)
      this.req.oauth_user = { _id: '5678' }
      this.AuthorizationMiddleware._getUserId(this.req, (err, userId) => {
        expect(err).to.not.exist
        expect(userId).to.equal('5678')
        done()
      })
    })

    it('should fall back to null', function (done) {
      this.SessionManager.getLoggedInUserId = sinon.stub().returns(null)
      this.req.oauth_user = undefined
      this.AuthorizationMiddleware._getUserId(this.req, (err, userId) => {
        expect(err).to.not.exist
        expect(userId).to.equal(null)
        done()
      })
    })
  })

  const METHODS_TO_TEST = {
    ensureUserCanReadProject: 'canUserReadProject',
    ensureUserCanWriteProjectSettings: 'canUserWriteProjectSettings',
    ensureUserCanWriteProjectContent: 'canUserWriteProjectContent',
  }
  Object.entries(METHODS_TO_TEST).forEach(
    ([middlewareMethod, managerMethod]) => {
      describe(middlewareMethod, function () {
        beforeEach(function () {
          this.req.params = { project_id: this.project_id }
          this.AuthorizationManager[managerMethod] = sinon.stub()
          this.AuthorizationMiddleware.redirectToRestricted = sinon.stub()
        })

        describe('with missing project_id', function () {
          beforeEach(function () {
            this.req.params = {}
          })

          it('should return an error to next', function () {
            this.AuthorizationMiddleware[middlewareMethod](
              this.req,
              this.res,
              this.next
            )
            this.next
              .calledWith(sinon.match.instanceOf(Error))
              .should.equal(true)
          })
        })

        describe('with logged in user', function () {
          beforeEach(function () {
            this.SessionManager.getLoggedInUserId.returns(this.userId)
          })

          describe('when user has permission', function () {
            beforeEach(function () {
              this.AuthorizationManager[managerMethod]
                .withArgs(this.userId, this.project_id, this.token)
                .yields(null, true)
            })

            it('should return next', function () {
              this.AuthorizationMiddleware[middlewareMethod](
                this.req,
                this.res,
                this.next
              )
              this.next.called.should.equal(true)
            })
          })

          describe("when user doesn't have permission", function () {
            beforeEach(function () {
              this.AuthorizationManager[managerMethod]
                .withArgs(this.userId, this.project_id, this.token)
                .yields(null, false)
            })

            it('should raise a 403', function () {
              this.AuthorizationMiddleware[middlewareMethod](
                this.req,
                this.res,
                this.next
              )
              this.next.called.should.equal(false)
              this.HttpErrorHandler.forbidden
                .calledWith(this.req, this.res)
                .should.equal(true)
            })
          })
        })

        describe('with anonymous user', function () {
          describe('when user has permission', function () {
            beforeEach(function () {
              this.SessionManager.getLoggedInUserId.returns(null)
              this.AuthorizationManager[managerMethod]
                .withArgs(null, this.project_id, this.token)
                .yields(null, true)
            })

            it('should return next', function () {
              this.AuthorizationMiddleware[middlewareMethod](
                this.req,
                this.res,
                this.next
              )
              this.next.called.should.equal(true)
            })
          })

          describe("when user doesn't have permission", function () {
            beforeEach(function () {
              this.SessionManager.getLoggedInUserId.returns(null)
              this.AuthorizationManager[managerMethod]
                .withArgs(null, this.project_id, this.token)
                .yields(null, false)
            })

            it('should redirect to redirectToRestricted', function () {
              this.AuthorizationMiddleware[middlewareMethod](
                this.req,
                this.res,
                this.next
              )
              this.next.called.should.equal(false)
              this.HttpErrorHandler.forbidden
                .calledWith(this.req, this.res)
                .should.equal(true)
            })
          })
        })

        describe('with malformed project id', function () {
          beforeEach(function () {
            this.req.params = { project_id: 'blah' }
            this.ObjectId.isValid = sinon.stub().returns(false)
          })

          it('should return a not found error', function (done) {
            this.AuthorizationMiddleware[middlewareMethod](
              this.req,
              this.res,
              error => {
                error.should.be.instanceof(Errors.NotFoundError)
                return done()
              }
            )
          })
        })
      })
    }
  )

  describe('ensureUserCanAdminProject', function () {
    beforeEach(function () {
      this.req.params = { project_id: this.project_id }
      this.AuthorizationManager.canUserAdminProject = sinon.stub()
      this.AuthorizationMiddleware.redirectToRestricted = sinon.stub()
    })

    describe('with missing project_id', function () {
      beforeEach(function () {
        this.req.params = {}
      })

      it('should return an error to next', function () {
        this.AuthorizationMiddleware.ensureUserCanAdminProject(
          this.req,
          this.res,
          this.next
        )
        this.next.calledWith(sinon.match.instanceOf(Error)).should.equal(true)
      })
    })

    describe('with logged in user', function () {
      beforeEach(function () {
        this.SessionManager.getLoggedInUserId.returns(this.userId)
      })

      describe('when user has permission', function () {
        beforeEach(function () {
          this.AuthorizationManager.canUserAdminProject
            .withArgs(this.userId, this.project_id, this.token)
            .yields(null, true)
        })

        it('should return next', function () {
          this.AuthorizationMiddleware.ensureUserCanAdminProject(
            this.req,
            this.res,
            this.next
          )
          this.next.called.should.equal(true)
        })
      })

      describe("when user doesn't have permission", function () {
        beforeEach(function () {
          this.AuthorizationManager.canUserAdminProject
            .withArgs(this.userId, this.project_id, this.token)
            .yields(null, false)
        })

        it('should invoke HTTP forbidden error handler', function (done) {
          this.HttpErrorHandler.forbidden = sinon.spy(() => done())
          this.AuthorizationMiddleware.ensureUserCanAdminProject(
            this.req,
            this.res
          )
        })
      })
    })

    describe('with anonymous user', function () {
      describe('when user has permission', function () {
        beforeEach(function () {
          this.SessionManager.getLoggedInUserId.returns(null)
          this.AuthorizationManager.canUserAdminProject
            .withArgs(null, this.project_id, this.token)
            .yields(null, true)
        })

        it('should return next', function () {
          this.AuthorizationMiddleware.ensureUserCanAdminProject(
            this.req,
            this.res,
            this.next
          )
          this.next.called.should.equal(true)
        })
      })

      describe("when user doesn't have permission", function () {
        beforeEach(function () {
          this.SessionManager.getLoggedInUserId.returns(null)
          this.AuthorizationManager.canUserAdminProject
            .withArgs(null, this.project_id, this.token)
            .yields(null, false)
        })

        it('should invoke HTTP forbidden error handler', function (done) {
          this.HttpErrorHandler.forbidden = sinon.spy(() => done())
          this.AuthorizationMiddleware.ensureUserCanAdminProject(
            this.req,
            this.res
          )
        })
      })
    })

    describe('with malformed project id', function () {
      beforeEach(function () {
        this.req.params = { project_id: 'blah' }
        this.ObjectId.isValid = sinon.stub().returns(false)
      })

      it('should return a not found error', function (done) {
        this.AuthorizationMiddleware.ensureUserCanAdminProject(
          this.req,
          this.res,
          error => {
            error.should.be.instanceof(Errors.NotFoundError)
            return done()
          }
        )
      })
    })
  })

  describe('ensureUserIsSiteAdmin', function () {
    beforeEach(function () {
      this.AuthorizationManager.isUserSiteAdmin = sinon.stub()
      this.AuthorizationMiddleware.redirectToRestricted = sinon.stub()
    })

    describe('with logged in user', function () {
      beforeEach(function () {
        this.SessionManager.getLoggedInUserId.returns(this.userId)
      })

      describe('when user has permission', function () {
        beforeEach(function () {
          this.AuthorizationManager.isUserSiteAdmin
            .withArgs(this.userId)
            .yields(null, true)
        })

        it('should return next', function () {
          this.AuthorizationMiddleware.ensureUserIsSiteAdmin(
            this.req,
            this.res,
            this.next
          )
          this.next.called.should.equal(true)
        })
      })

      describe("when user doesn't have permission", function () {
        beforeEach(function () {
          this.AuthorizationManager.isUserSiteAdmin
            .withArgs(this.userId)
            .yields(null, false)
        })

        it('should redirect to redirectToRestricted', function () {
          this.AuthorizationMiddleware.ensureUserIsSiteAdmin(
            this.req,
            this.res,
            this.next
          )
          this.next.called.should.equal(false)
          this.AuthorizationMiddleware.redirectToRestricted
            .calledWith(this.req, this.res, this.next)
            .should.equal(true)
        })
      })
    })

    describe('with anonymous user', function () {
      describe('when user has permission', function () {
        beforeEach(function () {
          this.SessionManager.getLoggedInUserId.returns(null)
          this.AuthorizationManager.isUserSiteAdmin
            .withArgs(null)
            .yields(null, true)
        })

        it('should return next', function () {
          this.AuthorizationMiddleware.ensureUserIsSiteAdmin(
            this.req,
            this.res,
            this.next
          )
          this.next.called.should.equal(true)
        })
      })

      describe("when user doesn't have permission", function () {
        beforeEach(function () {
          this.SessionManager.getLoggedInUserId.returns(null)
          this.AuthorizationManager.isUserSiteAdmin
            .withArgs(null)
            .yields(null, false)
        })

        it('should redirect to redirectToRestricted', function () {
          this.AuthorizationMiddleware.ensureUserIsSiteAdmin(
            this.req,
            this.res,
            this.next
          )
          this.next.called.should.equal(false)
          this.AuthorizationMiddleware.redirectToRestricted
            .calledWith(this.req, this.res, this.next)
            .should.equal(true)
        })
      })
    })
  })

  describe('blockRestrictedUserFromProject', function () {
    beforeEach(function () {
      this.AuthorizationMiddleware._getUserAndProjectId = sinon
        .stub()
        .callsArgWith(1, null, this.userId, this.project_id)
    })

    it('should issue a 401 response for a restricted user', function (done) {
      this.AuthorizationManager.isRestrictedUserForProject = sinon
        .stub()
        .callsArgWith(3, null, true)
      this.req = {}
      this.next = sinon.stub()
      this.res.sendStatus = status => {
        expect(status).to.equal(403)
        expect(
          this.AuthorizationManager.isRestrictedUserForProject.called
        ).to.equal(true)
        expect(this.next.called).to.equal(false)
        done()
      }
      this.AuthorizationMiddleware.blockRestrictedUserFromProject(
        this.req,
        this.res,
        this.next
      )
    })

    it('should pass through for a regular user', function (done) {
      this.AuthorizationManager.isRestrictedUserForProject = sinon
        .stub()
        .callsArgWith(3, null, false)
      this.req = {}
      this.res.sendStatus = sinon.stub()
      this.next = status => {
        expect(
          this.AuthorizationManager.isRestrictedUserForProject.called
        ).to.equal(true)
        expect(this.res.sendStatus.called).to.equal(false)
        done()
      }
      this.AuthorizationMiddleware.blockRestrictedUserFromProject(
        this.req,
        this.res,
        this.next
      )
    })
  })

  describe('ensureUserCanReadMultipleProjects', function () {
    beforeEach(function () {
      this.AuthorizationManager.canUserReadProject = sinon.stub()
      this.AuthorizationMiddleware.redirectToRestricted = sinon.stub()
      this.req.query = { project_ids: 'project1,project2' }
    })

    describe('with logged in user', function () {
      beforeEach(function () {
        this.SessionManager.getLoggedInUserId.returns(this.userId)
      })

      describe('when user has permission to access all projects', function () {
        beforeEach(function () {
          this.AuthorizationManager.canUserReadProject
            .withArgs(this.userId, 'project1', this.token)
            .yields(null, true)
          this.AuthorizationManager.canUserReadProject
            .withArgs(this.userId, 'project2', this.token)
            .yields(null, true)
        })

        it('should return next', function () {
          this.AuthorizationMiddleware.ensureUserCanReadMultipleProjects(
            this.req,
            this.res,
            this.next
          )
          this.next.called.should.equal(true)
        })
      })

      describe("when user doesn't have permission to access one of the projects", function () {
        beforeEach(function () {
          this.AuthorizationManager.canUserReadProject
            .withArgs(this.userId, 'project1', this.token)
            .yields(null, true)
          this.AuthorizationManager.canUserReadProject
            .withArgs(this.userId, 'project2', this.token)
            .yields(null, false)
        })

        it('should redirect to redirectToRestricted', function () {
          this.AuthorizationMiddleware.ensureUserCanReadMultipleProjects(
            this.req,
            this.res,
            this.next
          )
          this.next.called.should.equal(false)
          this.AuthorizationMiddleware.redirectToRestricted
            .calledWith(this.req, this.res, this.next)
            .should.equal(true)
        })
      })
    })

    describe('with anonymous user', function () {
      describe('when user has permission', function () {
        describe('when user has permission to access all projects', function () {
          beforeEach(function () {
            this.SessionManager.getLoggedInUserId.returns(null)
            this.AuthorizationManager.canUserReadProject
              .withArgs(null, 'project1', this.token)
              .yields(null, true)
            this.AuthorizationManager.canUserReadProject
              .withArgs(null, 'project2', this.token)
              .yields(null, true)
          })

          it('should return next', function () {
            this.AuthorizationMiddleware.ensureUserCanReadMultipleProjects(
              this.req,
              this.res,
              this.next
            )
            this.next.called.should.equal(true)
          })
        })

        describe("when user doesn't have permission to access one of the projects", function () {
          beforeEach(function () {
            this.SessionManager.getLoggedInUserId.returns(null)
            this.AuthorizationManager.canUserReadProject
              .withArgs(null, 'project1', this.token)
              .yields(null, true)
            this.AuthorizationManager.canUserReadProject
              .withArgs(null, 'project2', this.token)
              .yields(null, false)
          })

          it('should redirect to redirectToRestricted', function () {
            this.AuthorizationMiddleware.ensureUserCanReadMultipleProjects(
              this.req,
              this.res,
              this.next
            )
            this.next.called.should.equal(false)
            this.AuthorizationMiddleware.redirectToRestricted
              .calledWith(this.req, this.res, this.next)
              .should.equal(true)
          })
        })
      })
    })
  })
})
