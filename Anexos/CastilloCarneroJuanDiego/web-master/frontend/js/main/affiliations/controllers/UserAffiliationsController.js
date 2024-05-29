import _ from 'lodash'
/* eslint-disable
    max-len,
    no-return-assign,
    no-useless-escape,
*/

import App from '../../../base'
import getMeta from '../../../utils/meta'

export default App.controller(
  'UserAffiliationsController',
  function ($scope, $rootScope, UserAffiliationsDataService, $q, $window) {
    $scope.userEmails = []
    $scope.linkedInstitutionIds = []
    $scope.hideInstitutionNotifications = {}
    $scope.closeInstitutionNotification = type => {
      $scope.hideInstitutionNotifications[type] = true
    }
    $scope.samlBetaSession = ExposedSettings.hasSamlBeta
    $scope.samlInitPath = ExposedSettings.samlInitPath
    $scope.reconfirmationRemoveEmail = getMeta('ol-reconfirmationRemoveEmail')
    $scope.reconfirmedViaSAML = getMeta('ol-reconfirmedViaSAML')

    const LOCAL_AND_DOMAIN_REGEX = /([^@]+)@(.+)/
    const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\ ".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA -Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    const _matchLocalAndDomain = function (userEmailInput) {
      const match = userEmailInput
        ? userEmailInput.match(LOCAL_AND_DOMAIN_REGEX)
        : undefined
      if (match) {
        return { local: match[1], domain: match[2] }
      } else {
        return { local: null, domain: null }
      }
    }

    const _ssoAvailableForAffiliation = affiliation => {
      if (!affiliation) return false
      const institution = affiliation.institution
      if (!_ssoAvailableForInstitution(institution)) return false
      if (!institution.confirmed) return false // domain is confirmed, not the email
      return true
    }

    const _ssoAvailableForDomain = domain => {
      if (!domain) return false
      if (!domain.confirmed) return false // domain is confirmed, not the email
      const institution = domain.university
      if (!_ssoAvailableForInstitution(institution)) return false
      return true
    }

    const _ssoAvailableForInstitution = institution => {
      if (!ExposedSettings.hasSamlFeature) return false
      if (!institution) return false
      if (institution.ssoEnabled) return true
      if ($scope.samlBetaSession && institution.ssoBeta) return true
      return false
    }

    $scope.getEmailSuggestion = function (userInput) {
      const userInputLocalAndDomain = _matchLocalAndDomain(userInput)
      $scope.ui.isValidEmail = EMAIL_REGEX.test(userInput)
      $scope.ui.isBlacklistedEmail = false
      $scope.ui.showManualUniversitySelectionUI = false
      if (userInputLocalAndDomain.domain) {
        $scope.ui.isBlacklistedEmail = UserAffiliationsDataService.isDomainBlacklisted(
          userInputLocalAndDomain.domain
        )
        return UserAffiliationsDataService.getUniversityDomainFromPartialDomainInput(
          userInputLocalAndDomain.domain
        )
          .then(function (universityDomain) {
            const currentUserInputLocalAndDomain = _matchLocalAndDomain(
              $scope.newAffiliation.email
            )
            if (
              currentUserInputLocalAndDomain.domain ===
              universityDomain.hostname
            ) {
              $scope.newAffiliation.university = universityDomain.university
              $scope.newAffiliation.department = universityDomain.department
              $scope.newAffiliation.ssoAvailable = _ssoAvailableForDomain(
                universityDomain
              )
            } else {
              _resetAffiliationSuggestion()
            }
            return $q.resolve(
              `${userInputLocalAndDomain.local}@${universityDomain.hostname}`
            )
          })
          .catch(function () {
            _resetAffiliationSuggestion()
            return $q.reject(null)
          })
      } else {
        _resetAffiliationSuggestion()
        return $q.reject(null)
      }
    }

    $scope.linkInstitutionAcct = function (email, institutionId) {
      _resetMakingRequestType()
      $scope.ui.isMakingRequest = true
      $scope.ui.isProcessing = true
      $window.location.href = `${$scope.samlInitPath}?university_id=${institutionId}&auto=/user/settings&email=${email}`
    }

    $scope.selectUniversityManually = function () {
      _resetAffiliationSuggestion()
      $scope.ui.showManualUniversitySelectionUI = true
    }

    $scope.changeAffiliation = function (userEmail) {
      if (_.get(userEmail, ['affiliation', 'institution', 'id'])) {
        UserAffiliationsDataService.getUniversityDetails(
          userEmail.affiliation.institution.id
        ).then(
          universityDetails =>
            ($scope.affiliationToChange.university = universityDetails)
        )
      }

      $scope.affiliationToChange.email = userEmail.email
      $scope.affiliationToChange.role = userEmail.affiliation.role
      $scope.affiliationToChange.department = userEmail.affiliation.department
    }

    $scope.saveAffiliationChange = function (userEmail) {
      userEmail.affiliation.role = $scope.affiliationToChange.role
      userEmail.affiliation.department = $scope.affiliationToChange.department
      _resetAffiliationToChange()
      return _monitorRequest(
        UserAffiliationsDataService.addRoleAndDepartment(
          userEmail.email,
          userEmail.affiliation.role,
          userEmail.affiliation.department
        )
      ).then(() => setTimeout(() => _getUserEmails()))
    }

    $scope.cancelAffiliationChange = email => _resetAffiliationToChange()

    $scope.isChangingAffiliation = email =>
      $scope.affiliationToChange.email === email

    $scope.showAddEmailForm = () => ($scope.ui.showAddEmailUI = true)

    $scope.addNewEmail = function () {
      let addEmailPromise
      if (!$scope.newAffiliation.university) {
        addEmailPromise = UserAffiliationsDataService.addUserEmail(
          $scope.newAffiliation.email
        )
      } else {
        if ($scope.newAffiliation.university.isUserSuggested) {
          addEmailPromise = UserAffiliationsDataService.addUserAffiliationWithUnknownUniversity(
            $scope.newAffiliation.email,
            $scope.newAffiliation.university.name,
            $scope.newAffiliation.country.code,
            $scope.newAffiliation.role,
            $scope.newAffiliation.department
          )
        } else {
          addEmailPromise = UserAffiliationsDataService.addUserAffiliation(
            $scope.newAffiliation.email,
            $scope.newAffiliation.university.id,
            $scope.newAffiliation.role,
            $scope.newAffiliation.department
          )
        }
      }

      $scope.ui.isAddingNewEmail = true
      $scope.ui.showAddEmailUI = false
      return _monitorRequest(addEmailPromise)
        .then(function () {
          _resetNewAffiliation()
          _resetAddingEmail()
          setTimeout(() => _getUserEmails())
        })
        .finally(() => ($scope.ui.isAddingNewEmail = false))
    }

    $scope.setDefaultUserEmail = userEmail =>
      _monitorRequest(
        UserAffiliationsDataService.setDefaultUserEmail(userEmail.email)
      ).then(function () {
        for (const email of $scope.userEmails || []) {
          email.default = false
        }
        userEmail.default = true
        window.usersEmail = userEmail.email
        $rootScope.usersEmail = userEmail.email
      })

    $scope.removeUserEmail = function (userEmail) {
      $scope.userEmails = $scope.userEmails.filter(ue => ue !== userEmail)
      return _monitorRequest(
        UserAffiliationsDataService.removeUserEmail(userEmail.email)
      )
    }

    $scope.resendConfirmationEmail = function (userEmail) {
      _resetMakingRequestType()
      $scope.ui.isResendingConfirmation = true
      return _monitorRequest(
        UserAffiliationsDataService.resendConfirmationEmail(userEmail.email)
      ).finally(() => ($scope.ui.isResendingConfirmation = false))
    }

    $scope.acknowledgeError = function () {
      _reset()
      return _getUserEmails()
    }

    var _resetAffiliationToChange = () =>
      ($scope.affiliationToChange = {
        email: '',
        university: null,
        role: null,
        department: null,
      })

    var _resetNewAffiliation = () =>
      ($scope.newAffiliation = {
        email: '',
        country: null,
        university: null,
        role: null,
        department: null,
      })

    var _resetAddingEmail = function () {
      $scope.ui.showAddEmailUI = false
      $scope.ui.isValidEmail = false
      $scope.ui.isBlacklistedEmail = false
      $scope.ui.showManualUniversitySelectionUI = false
    }

    var _resetAffiliationSuggestion = () => {
      $scope.newAffiliation = {
        email: $scope.newAffiliation.email,
      }
    }

    var _resetMakingRequestType = function () {
      $scope.ui.isLoadingEmails = false
      $scope.ui.isProcessing = false
      $scope.ui.isResendingConfirmation = false
    }

    var _reset = function () {
      $scope.ui = {
        hasError: false,
        errorMessage: '',
        showChangeAffiliationUI: false,
        isMakingRequest: false,
        isLoadingEmails: false,
        isAddingNewEmail: false,
      }
      _resetAffiliationToChange()
      _resetNewAffiliation()
      return _resetAddingEmail()
    }
    _reset()

    var _monitorRequest = function (promise) {
      $scope.ui.hasError = false
      $scope.ui.isMakingRequest = true
      promise
        .catch(function (response) {
          $scope.ui.hasError = true
          $scope.ui.errorMessage = _.get(response, ['data', 'message'])
        })
        .finally(() => ($scope.ui.isMakingRequest = false))
      return promise
    }

    $scope.inReconfirmNotificationPeriod = function (emailData) {
      return _.get(emailData, ['affiliation', 'inReconfirmNotificationPeriod'])
    }

    $scope.institutionAlreadyLinked = function (emailData) {
      const institutionId =
        emailData.affiliation &&
        emailData.affiliation.institution &&
        emailData.affiliation.institution &&
        emailData.affiliation.institution.id
          ? emailData.affiliation.institution.id.toString()
          : undefined
      return $scope.linkedInstitutionIds.indexOf(institutionId) !== -1
    }

    // Populates the emails table
    var _getUserEmails = function () {
      _resetMakingRequestType()
      $scope.ui.isLoadingEmails = true
      _monitorRequest(
        UserAffiliationsDataService.getUserEmailsEnsureAffiliation()
      )
        .then(emails => {
          $scope.userEmails = emails.map(email => {
            email.ssoAvailable = _ssoAvailableForAffiliation(email.affiliation)
            return email
          })
          $scope.linkedInstitutionIds = emails
            .filter(email => {
              return !!email.samlProviderId
            })
            .map(email => email.samlProviderId)
        })
        .finally(() => ($scope.ui.isLoadingEmails = false))
    }
    _getUserEmails()
  }
)
