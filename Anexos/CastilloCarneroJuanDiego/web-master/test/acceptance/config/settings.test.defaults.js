const { merge } = require('@overleaf/settings/merge')

let features

const httpAuthUser = 'sharelatex'
const httpAuthPass = 'password'
const httpAuthUsers = {}
httpAuthUsers[httpAuthUser] = httpAuthPass

module.exports = {
  catchErrors: false,
  clsiCookie: undefined,

  cacheStaticAssets: true,

  httpAuthUsers,
  secureCookie: false,
  security: {
    sessionSecret: 'static-secret-for-tests',
  },
  adminDomains: process.env.ADMIN_DOMAINS
    ? JSON.parse(process.env.ADMIN_DOMAINS)
    : ['example.com'],

  statusPageUrl: 'status.example.com',

  apis: {
    linkedUrlProxy: {
      url: process.env.LINKED_URL_PROXY,
    },

    web: {
      user: httpAuthUser,
      pass: httpAuthPass,
    },
  },

  // for registration via SL, set enableLegacyRegistration to true
  // for registration via Overleaf v1, set enableLegacyLogin to true

  // Currently, acceptance tests require enableLegacyRegistration.
  enableLegacyRegistration: true,

  features: (features = {
    v1_free: {
      collaborators: 1,
      dropbox: false,
      versioning: false,
      github: true,
      gitBridge: true,
      templates: false,
      references: false,
      referencesSearch: false,
      mendeley: true,
      zotero: true,
      compileTimeout: 60,
      compileGroup: 'standard',
      trackChanges: false,
    },
    personal: {
      collaborators: 1,
      dropbox: false,
      versioning: false,
      github: false,
      gitBridge: false,
      templates: false,
      references: false,
      referencesSearch: false,
      mendeley: false,
      zotero: false,
      compileTimeout: 60,
      compileGroup: 'standard',
      trackChanges: false,
    },
    collaborator: {
      collaborators: 10,
      dropbox: true,
      versioning: true,
      github: true,
      gitBridge: true,
      templates: true,
      references: true,
      referencesSearch: true,
      mendeley: true,
      zotero: true,
      compileTimeout: 180,
      compileGroup: 'priority',
      trackChanges: true,
    },
    professional: {
      collaborators: -1,
      dropbox: true,
      versioning: true,
      github: true,
      gitBridge: true,
      templates: true,
      references: true,
      referencesSearch: true,
      mendeley: true,
      zotero: true,
      compileTimeout: 180,
      compileGroup: 'priority',
      trackChanges: true,
    },
  }),

  defaultFeatures: features.personal,
  defaultPlanCode: 'personal',
  institutionPlanCode: 'professional',

  plans: [
    {
      planCode: 'v1_free',
      name: 'V1 Free',
      price: 0,
      features: features.v1_free,
    },
    {
      planCode: 'personal',
      name: 'Personal',
      price: 0,
      features: features.personal,
    },
    {
      planCode: 'collaborator',
      name: 'Collaborator',
      price: 1500,
      features: features.collaborator,
    },
    {
      planCode: 'professional',
      name: 'Professional',
      price: 3000,
      features: features.professional,
    },
  ],

  bonus_features: {
    1: {
      collaborators: 2,
      dropbox: false,
      versioning: false,
    },
    3: {
      collaborators: 4,
      dropbox: false,
      versioning: false,
    },
    6: {
      collaborators: 4,
      dropbox: true,
      versioning: true,
    },
    9: {
      collaborators: -1,
      dropbox: true,
      versioning: true,
    },
  },

  redirects: {
    '/redirect/one': '/destination/one',
    '/redirect/get_and_post': {
      methods: ['get', 'post'],
      url: '/destination/get_and_post',
    },
    '/redirect/base_url': {
      baseUrl: 'https://example.com',
      url: '/destination/base_url',
    },
    '/redirect/params/:id': {
      url(params) {
        return `/destination/${params.id}/params`
      },
    },
    '/redirect/qs': '/destination/qs',
    '/docs_v1': {
      url: '/docs',
    },
  },

  reconfirmNotificationDays: 14,

  unsupportedBrowsers: {
    ie: '<=11',
  },

  // No email in tests
  email: undefined,

  test: {
    counterInit: 0,
  },
}

module.exports.mergeWith = function (overrides) {
  return merge(overrides, module.exports)
}
