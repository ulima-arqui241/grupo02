const Settings = require('@overleaf/settings')
const mongoose = require('../infrastructure/Mongoose')
const TokenGenerator = require('../Features/TokenGenerator/TokenGenerator')
const { Schema } = mongoose
const { ObjectId } = Schema

// See https://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address/574698#574698
const MAX_EMAIL_LENGTH = 254

const AuditLogEntrySchema = new Schema({
  _id: false,
  info: { type: Object },
  initiatorId: { type: Schema.Types.ObjectId },
  ipAddress: { type: String },
  operation: { type: String },
  userId: { type: Schema.Types.ObjectId },
  timestamp: { type: Date },
})

const UserSchema = new Schema({
  email: { type: String, default: '', maxlength: MAX_EMAIL_LENGTH },
  emails: [
    {
      email: { type: String, default: '', maxlength: MAX_EMAIL_LENGTH },
      reversedHostname: { type: String, default: '' },
      createdAt: {
        type: Date,
        default() {
          return new Date()
        },
      },
      confirmedAt: { type: Date },
      samlProviderId: { type: String },
      affiliationUnchecked: { type: Boolean },
      reconfirmedAt: { type: Date },
    },
  ],
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  role: { type: String, default: '' },
  institution: { type: String, default: '' },
  hashedPassword: String,
  isAdmin: { type: Boolean, default: false },
  staffAccess: {
    publisherMetrics: { type: Boolean, default: false },
    publisherManagement: { type: Boolean, default: false },
    institutionMetrics: { type: Boolean, default: false },
    institutionManagement: { type: Boolean, default: false },
    groupMetrics: { type: Boolean, default: false },
    groupManagement: { type: Boolean, default: false },
    adminMetrics: { type: Boolean, default: false },
  },
  signUpDate: {
    type: Date,
    default() {
      return new Date()
    },
  },
  lastLoggedIn: { type: Date },
  lastLoginIp: { type: String, default: '' },
  loginCount: { type: Number, default: 0 },
  holdingAccount: { type: Boolean, default: false },
  ace: {
    mode: { type: String, default: 'none' },
    theme: { type: String, default: 'textmate' },
    overallTheme: { type: String, default: '' },
    fontSize: { type: Number, default: '12' },
    autoComplete: { type: Boolean, default: true },
    autoPairDelimiters: { type: Boolean, default: true },
    spellCheckLanguage: { type: String, default: 'en' },
    pdfViewer: { type: String, default: 'pdfjs' },
    syntaxValidation: { type: Boolean },
    fontFamily: { type: String },
    lineHeight: { type: String },
  },
  features: {
    collaborators: {
      type: Number,
      default: Settings.defaultFeatures.collaborators,
    },
    versioning: { type: Boolean, default: Settings.defaultFeatures.versioning },
    dropbox: { type: Boolean, default: Settings.defaultFeatures.dropbox },
    github: { type: Boolean, default: Settings.defaultFeatures.github },
    gitBridge: { type: Boolean, default: Settings.defaultFeatures.gitBridge },
    compileTimeout: {
      type: Number,
      default: Settings.defaultFeatures.compileTimeout,
    },
    compileGroup: {
      type: String,
      default: Settings.defaultFeatures.compileGroup,
    },
    templates: { type: Boolean, default: Settings.defaultFeatures.templates },
    references: { type: Boolean, default: Settings.defaultFeatures.references },
    trackChanges: {
      type: Boolean,
      default: Settings.defaultFeatures.trackChanges,
    },
    mendeley: { type: Boolean, default: Settings.defaultFeatures.mendeley },
    zotero: { type: Boolean, default: Settings.defaultFeatures.zotero },
    referencesSearch: {
      type: Boolean,
      default: Settings.defaultFeatures.referencesSearch,
    },
  },
  featuresOverrides: [
    {
      createdAt: {
        type: Date,
        default() {
          return new Date()
        },
      },
      expiresAt: { type: Date },
      note: { type: String },
      features: {
        collaborators: { type: Number },
        versioning: { type: Boolean },
        dropbox: { type: Boolean },
        github: { type: Boolean },
        gitBridge: { type: Boolean },
        compileTimeout: { type: Number },
        compileGroup: { type: String },
        templates: { type: Boolean },
        trackChanges: { type: Boolean },
        mendeley: { type: Boolean },
        zotero: { type: Boolean },
        referencesSearch: { type: Boolean },
      },
    },
  ],
  featuresUpdatedAt: { type: Date },
  // when auto-merged from SL and must-reconfirm is set, we may end up using
  // `sharelatexHashedPassword` to recover accounts...
  sharelatexHashedPassword: String,
  must_reconfirm: { type: Boolean, default: false },
  referal_id: {
    type: String,
    default() {
      return TokenGenerator.generateReferralId()
    },
  },
  refered_users: [{ type: ObjectId, ref: 'User' }],
  refered_user_count: { type: Number, default: 0 },
  refProviders: {
    // The actual values are managed by third-party-references.
    mendeley: Schema.Types.Mixed,
    zotero: Schema.Types.Mixed,
  },
  alphaProgram: { type: Boolean, default: false }, // experimental features
  betaProgram: { type: Boolean, default: false },
  overleaf: {
    id: { type: Number },
    accessToken: { type: String },
    refreshToken: { type: String },
  },
  awareOfV2: { type: Boolean, default: false },
  samlIdentifiers: { type: Array, default: [] },
  thirdPartyIdentifiers: { type: Array, default: [] },
  migratedAt: { type: Date },
  twoFactorAuthentication: {
    createdAt: { type: Date },
    enrolledAt: { type: Date },
    secret: { type: String },
  },
  onboardingEmailSentAt: { type: Date },
  auditLog: [AuditLogEntrySchema],
  splitTests: Schema.Types.Mixed,
})

exports.User = mongoose.model('User', UserSchema)
exports.UserSchema = UserSchema
