/* eslint-disable
    camelcase,
    node/handle-callback-err,
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ProjectGetter = require('../Project/ProjectGetter')
const OError = require('@overleaf/o-error')
const ProjectLocator = require('../Project/ProjectLocator')
const ProjectEntityHandler = require('../Project/ProjectEntityHandler')
const ProjectEntityUpdateHandler = require('../Project/ProjectEntityUpdateHandler')
const logger = require('logger-sharelatex')
const _ = require('lodash')

module.exports = {
  getDocument(req, res, next) {
    if (next == null) {
      next = function (error) {}
    }
    const project_id = req.params.Project_id
    const { doc_id } = req.params
    const plain =
      __guard__(req != null ? req.query : undefined, x => x.plain) === 'true'
    return ProjectGetter.getProject(
      project_id,
      { rootFolder: true, overleaf: true },
      function (error, project) {
        if (error != null) {
          return next(error)
        }
        if (project == null) {
          return res.sendStatus(404)
        }
        return ProjectLocator.findElement(
          { project, element_id: doc_id, type: 'doc' },
          function (error, doc, path) {
            if (error != null) {
              OError.tag(error, 'error finding element for getDocument', {
                doc_id,
                project_id,
              })
              return next(error)
            }
            return ProjectEntityHandler.getDoc(
              project_id,
              doc_id,
              function (error, lines, rev, version, ranges) {
                if (error != null) {
                  OError.tag(
                    error,
                    'error finding doc contents for getDocument',
                    {
                      doc_id,
                      project_id,
                    }
                  )
                  return next(error)
                }
                if (plain) {
                  res.type('text/plain')
                  return res.send(lines.join('\n'))
                } else {
                  const projectHistoryId = _.get(project, 'overleaf.history.id')
                  const projectHistoryType = _.get(
                    project,
                    'overleaf.history.display'
                  )
                    ? 'project-history'
                    : undefined // for backwards compatibility, don't send anything if the project is still on track-changes
                  return res.json({
                    lines,
                    version,
                    ranges,
                    pathname: path.fileSystem,
                    projectHistoryId,
                    projectHistoryType,
                  })
                }
              }
            )
          }
        )
      }
    )
  },

  setDocument(req, res, next) {
    if (next == null) {
      next = function (error) {}
    }
    const project_id = req.params.Project_id
    const { doc_id } = req.params
    const { lines, version, ranges, lastUpdatedAt, lastUpdatedBy } = req.body
    return ProjectEntityUpdateHandler.updateDocLines(
      project_id,
      doc_id,
      lines,
      version,
      ranges,
      lastUpdatedAt,
      lastUpdatedBy,
      function (error) {
        if (error != null) {
          OError.tag(error, 'error finding element for getDocument', {
            doc_id,
            project_id,
          })
          return next(error)
        }
        logger.log(
          { doc_id, project_id },
          'finished receiving set document request from api (docupdater)'
        )
        return res.sendStatus(200)
      }
    )
  },
}

function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null
    ? transform(value)
    : undefined
}
