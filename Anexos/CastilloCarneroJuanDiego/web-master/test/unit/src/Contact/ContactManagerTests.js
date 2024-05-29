/* eslint-disable
    max-len,
    no-return-assign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const sinon = require('sinon')
const modulePath = '../../../../app/src/Features/Contacts/ContactManager'
const SandboxedModule = require('sandboxed-module')

describe('ContactManager', function () {
  beforeEach(function () {
    this.ContactManager = SandboxedModule.require(modulePath, {
      requires: {
        request: (this.request = sinon.stub()),
        '@overleaf/settings': (this.settings = {
          apis: {
            contacts: {
              url: 'contacts.sharelatex.com',
            },
          },
        }),
      },
    })

    this.user_id = 'user-id-123'
    this.contact_id = 'contact-id-123'
    return (this.callback = sinon.stub())
  })

  describe('getContacts', function () {
    describe('with a successful response code', function () {
      beforeEach(function () {
        this.request.get = sinon
          .stub()
          .callsArgWith(
            1,
            null,
            { statusCode: 204 },
            { contact_ids: (this.contact_ids = ['mock', 'contact_ids']) }
          )
        return this.ContactManager.getContactIds(
          this.user_id,
          { limit: 42 },
          this.callback
        )
      })

      it('should get the contacts from the contacts api', function () {
        return this.request.get
          .calledWith({
            url: `${this.settings.apis.contacts.url}/user/${this.user_id}/contacts`,
            qs: { limit: 42 },
            json: true,
            jar: false,
          })
          .should.equal(true)
      })

      it('should call the callback with the contatcs', function () {
        return this.callback
          .calledWith(null, this.contact_ids)
          .should.equal(true)
      })
    })

    describe('with a failed response code', function () {
      beforeEach(function () {
        this.request.get = sinon
          .stub()
          .callsArgWith(1, null, { statusCode: 500 }, null)
        return this.ContactManager.getContactIds(
          this.user_id,
          { limit: 42 },
          this.callback
        )
      })

      it('should call the callback with an error', function () {
        return this.callback
          .calledWith(
            sinon.match
              .instanceOf(Error)
              .and(
                sinon.match.has(
                  'message',
                  'contacts api responded with non-success code: 500'
                )
              )
          )
          .should.equal(true)
      })
    })
  })

  describe('addContact', function () {
    describe('with a successful response code', function () {
      beforeEach(function () {
        this.request.post = sinon
          .stub()
          .callsArgWith(1, null, { statusCode: 200 }, null)
        return this.ContactManager.addContact(
          this.user_id,
          this.contact_id,
          this.callback
        )
      })

      it('should add the contacts for the user in the contacts api', function () {
        return this.request.post
          .calledWith({
            url: `${this.settings.apis.contacts.url}/user/${this.user_id}/contacts`,
            json: {
              contact_id: this.contact_id,
            },
            jar: false,
          })
          .should.equal(true)
      })

      it('should call the callback', function () {
        return this.callback.called.should.equal(true)
      })
    })

    describe('with a failed response code', function () {
      beforeEach(function () {
        this.request.post = sinon
          .stub()
          .callsArgWith(1, null, { statusCode: 500 }, null)
        return this.ContactManager.addContact(
          this.user_id,
          this.contact_id,
          this.callback
        )
      })

      it('should call the callback with an error', function () {
        return this.callback
          .calledWith(
            sinon.match
              .instanceOf(Error)
              .and(
                sinon.match.has(
                  'message',
                  'contacts api responded with non-success code: 500'
                )
              )
          )
          .should.equal(true)
      })
    })
  })
})
