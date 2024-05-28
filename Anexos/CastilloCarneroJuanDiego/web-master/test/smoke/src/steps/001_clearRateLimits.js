const OError = require('@overleaf/o-error')
const Settings = require('@overleaf/settings')
const RateLimiter = require('../../../../app/src/infrastructure/RateLimiter')

async function clearRateLimit(endpointName, subject) {
  try {
    await RateLimiter.promises.clearRateLimit(endpointName, subject)
  } catch (err) {
    throw new OError(
      'error clearing rate limit',
      { endpointName, subject },
      err
    )
  }
}

async function clearLoginRateLimit() {
  await clearRateLimit('login', Settings.smokeTest.user)
}

async function clearOverleafLoginRateLimit() {
  if (!Settings.overleaf) return
  await clearRateLimit('overleaf-login', Settings.smokeTest.rateLimitSubject)
}

async function clearOpenProjectRateLimit() {
  await clearRateLimit(
    'open-project',
    `${Settings.smokeTest.projectId}:${Settings.smokeTest.userId}`
  )
}

async function run({ processWithTimeout, timeout }) {
  await processWithTimeout({
    work: Promise.all([
      clearLoginRateLimit(),
      clearOverleafLoginRateLimit(),
      clearOpenProjectRateLimit(),
    ]),
    timeout,
    message: 'cleanupRateLimits timed out',
  })
}

module.exports = { run }
