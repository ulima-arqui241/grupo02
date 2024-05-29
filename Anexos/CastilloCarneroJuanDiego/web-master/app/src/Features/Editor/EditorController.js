/* eslint-disable
    camelcase,
    node/handle-callback-err,
    max-len,
    no-dupe-keys,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const logger = require('logger-sharelatex')
const OError = require('@overleaf/o-error')
const Metrics = require('@overleaf/metrics')
const ProjectEntityUpdateHandler = require('../Project/ProjectEntityUpdateHandler')
const ProjectOptionsHandler = require('../Project/ProjectOptionsHandler')
const ProjectDetailsHandler = require('../Project/ProjectDetailsHandler')
const ProjectDeleter = require('../Project/ProjectDeleter')
const DocumentUpdaterHandler = require('../DocumentUpdater/DocumentUpdaterHandler')
const EditorRealTimeController = require('./EditorRealTimeController')
const async = require('async')
const PublicAccessLevels = require('../Authorization/PublicAccessLevels')
const _ = require('underscore')
const { promisifyAll } = require('../../util/promises')

const EditorController = {
  addDoc(project_id, folder_id, docName, docLines, source, user_id, callback) {
    if (callback == null) {
      callback = function (error, doc) {}
    }
    return EditorController.addDocWithRanges(
      project_id,
      folder_id,
      docName,
      docLines,
      {},
      source,
      user_id,
      callback
    )
  },

  addDocWithRanges(
    project_id,
    folder_id,
    docName,
    docLines,
    docRanges,
    source,
    user_id,
    callback
  ) {
    if (callback == null) {
      callback = function (error, doc) {}
    }
    docName = docName.trim()
    Metrics.inc('editor.add-doc')
    return ProjectEntityUpdateHandler.addDocWithRanges(
      project_id,
      folder_id,
      docName,
      docLines,
      docRanges,
      user_id,
      (err, doc, folder_id) => {
        if (err != null) {
          OError.tag(err, 'error adding doc without lock', {
            project_id,
            docName,
          })
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'reciveNewDoc',
          folder_id,
          doc,
          source,
          user_id
        )
        return callback(err, doc)
      }
    )
  },

  addFile(
    project_id,
    folder_id,
    fileName,
    fsPath,
    linkedFileData,
    source,
    user_id,
    callback
  ) {
    if (callback == null) {
      callback = function (error, file) {}
    }
    fileName = fileName.trim()
    Metrics.inc('editor.add-file')
    return ProjectEntityUpdateHandler.addFile(
      project_id,
      folder_id,
      fileName,
      fsPath,
      linkedFileData,
      user_id,
      (err, fileRef, folder_id) => {
        if (err != null) {
          OError.tag(err, 'error adding file without lock', {
            project_id,
            folder_id,
            fileName,
          })
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'reciveNewFile',
          folder_id,
          fileRef,
          source,
          linkedFileData,
          user_id
        )
        return callback(err, fileRef)
      }
    )
  },

  upsertDoc(
    project_id,
    folder_id,
    docName,
    docLines,
    source,
    user_id,
    callback
  ) {
    if (callback == null) {
      callback = function (err) {}
    }
    return ProjectEntityUpdateHandler.upsertDoc(
      project_id,
      folder_id,
      docName,
      docLines,
      source,
      user_id,
      function (err, doc, didAddNewDoc) {
        if (didAddNewDoc) {
          EditorRealTimeController.emitToRoom(
            project_id,
            'reciveNewDoc',
            folder_id,
            doc,
            source,
            user_id
          )
        }
        return callback(err, doc)
      }
    )
  },

  upsertFile(
    project_id,
    folder_id,
    fileName,
    fsPath,
    linkedFileData,
    source,
    user_id,
    callback
  ) {
    if (callback == null) {
      callback = function (err, file) {}
    }
    return ProjectEntityUpdateHandler.upsertFile(
      project_id,
      folder_id,
      fileName,
      fsPath,
      linkedFileData,
      user_id,
      function (err, newFile, didAddFile, existingFile) {
        if (err != null) {
          return callback(err)
        }
        if (!didAddFile) {
          // replacement, so remove the existing file from the client
          EditorRealTimeController.emitToRoom(
            project_id,
            'removeEntity',
            existingFile._id,
            source
          )
        }
        // now add the new file on the client
        EditorRealTimeController.emitToRoom(
          project_id,
          'reciveNewFile',
          folder_id,
          newFile,
          source,
          linkedFileData,
          user_id
        )
        return callback(null, newFile)
      }
    )
  },

  upsertDocWithPath(
    project_id,
    elementPath,
    docLines,
    source,
    user_id,
    callback
  ) {
    return ProjectEntityUpdateHandler.upsertDocWithPath(
      project_id,
      elementPath,
      docLines,
      source,
      user_id,
      function (err, doc, didAddNewDoc, newFolders, lastFolder) {
        if (err != null) {
          return callback(err)
        }
        return EditorController._notifyProjectUsersOfNewFolders(
          project_id,
          newFolders,
          function (err) {
            if (err != null) {
              return callback(err)
            }
            if (didAddNewDoc) {
              EditorRealTimeController.emitToRoom(
                project_id,
                'reciveNewDoc',
                lastFolder._id,
                doc,
                source,
                user_id
              )
            }
            return callback()
          }
        )
      }
    )
  },

  upsertFileWithPath(
    project_id,
    elementPath,
    fsPath,
    linkedFileData,
    source,
    user_id,
    callback
  ) {
    return ProjectEntityUpdateHandler.upsertFileWithPath(
      project_id,
      elementPath,
      fsPath,
      linkedFileData,
      user_id,
      function (
        err,
        newFile,
        didAddFile,
        existingFile,
        newFolders,
        lastFolder
      ) {
        if (err != null) {
          return callback(err)
        }
        return EditorController._notifyProjectUsersOfNewFolders(
          project_id,
          newFolders,
          function (err) {
            if (err != null) {
              return callback(err)
            }
            if (!didAddFile) {
              // replacement, so remove the existing file from the client
              EditorRealTimeController.emitToRoom(
                project_id,
                'removeEntity',
                existingFile._id,
                source
              )
            }
            // now add the new file on the client
            EditorRealTimeController.emitToRoom(
              project_id,
              'reciveNewFile',
              lastFolder._id,
              newFile,
              source,
              linkedFileData,
              user_id
            )
            return callback()
          }
        )
      }
    )
  },

  addFolder(project_id, folder_id, folderName, source, userId, callback) {
    if (callback == null) {
      callback = function (error, folder) {}
    }
    folderName = folderName.trim()
    Metrics.inc('editor.add-folder')
    return ProjectEntityUpdateHandler.addFolder(
      project_id,
      folder_id,
      folderName,
      (err, folder, folder_id) => {
        if (err != null) {
          OError.tag(err, 'could not add folder', {
            project_id,
            folder_id,
            folderName,
            source,
          })
          return callback(err)
        }
        return EditorController._notifyProjectUsersOfNewFolder(
          project_id,
          folder_id,
          folder,
          userId,
          function (err) {
            if (err != null) {
              return callback(err)
            }
            return callback(null, folder)
          }
        )
      }
    )
  },

  mkdirp(project_id, path, callback) {
    if (callback == null) {
      callback = function (error, newFolders, lastFolder) {}
    }
    logger.log({ project_id, path }, "making directories if they don't exist")
    return ProjectEntityUpdateHandler.mkdirp(
      project_id,
      path,
      (err, newFolders, lastFolder) => {
        if (err != null) {
          OError.tag(err, 'could not mkdirp', {
            project_id,
            path,
          })
          return callback(err)
        }

        return EditorController._notifyProjectUsersOfNewFolders(
          project_id,
          newFolders,
          function (err) {
            if (err != null) {
              return callback(err)
            }
            return callback(null, newFolders, lastFolder)
          }
        )
      }
    )
  },

  deleteEntity(project_id, entity_id, entityType, source, userId, callback) {
    if (callback == null) {
      callback = function (error) {}
    }
    Metrics.inc('editor.delete-entity')
    return ProjectEntityUpdateHandler.deleteEntity(
      project_id,
      entity_id,
      entityType,
      userId,
      function (err) {
        if (err != null) {
          OError.tag(err, 'could not delete entity', {
            project_id,
            entity_id,
            entityType,
          })
          return callback(err)
        }
        logger.log(
          { project_id, entity_id, entityType },
          'telling users entity has been deleted'
        )
        EditorRealTimeController.emitToRoom(
          project_id,
          'removeEntity',
          entity_id,
          source
        )
        return callback()
      }
    )
  },

  deleteEntityWithPath(project_id, path, source, user_id, callback) {
    return ProjectEntityUpdateHandler.deleteEntityWithPath(
      project_id,
      path,
      user_id,
      function (err, entity_id) {
        if (err != null) {
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'removeEntity',
          entity_id,
          source
        )
        return callback(null, entity_id)
      }
    )
  },

  updateProjectDescription(project_id, description, callback) {
    if (callback == null) {
      callback = function () {}
    }
    logger.log({ project_id, description }, 'updating project description')
    return ProjectDetailsHandler.setProjectDescription(
      project_id,
      description,
      function (err) {
        if (err != null) {
          OError.tag(
            err,
            'something went wrong setting the project description',
            {
              project_id,
              description,
            }
          )
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'projectDescriptionUpdated',
          description
        )
        return callback()
      }
    )
  },

  deleteProject(project_id, callback) {
    Metrics.inc('editor.delete-project')
    return ProjectDeleter.deleteProject(project_id, callback)
  },

  renameEntity(project_id, entity_id, entityType, newName, userId, callback) {
    if (callback == null) {
      callback = function (error) {}
    }
    Metrics.inc('editor.rename-entity')
    return ProjectEntityUpdateHandler.renameEntity(
      project_id,
      entity_id,
      entityType,
      newName,
      userId,
      function (err) {
        if (err != null) {
          OError.tag(err, 'error renaming entity', {
            project_id,
            entity_id,
            entityType,
            newName,
          })
          return callback(err)
        }
        if (newName.length > 0) {
          EditorRealTimeController.emitToRoom(
            project_id,
            'reciveEntityRename',
            entity_id,
            newName
          )
        }
        return callback()
      }
    )
  },

  moveEntity(project_id, entity_id, folder_id, entityType, userId, callback) {
    if (callback == null) {
      callback = function (error) {}
    }
    Metrics.inc('editor.move-entity')
    return ProjectEntityUpdateHandler.moveEntity(
      project_id,
      entity_id,
      folder_id,
      entityType,
      userId,
      function (err) {
        if (err != null) {
          OError.tag(err, 'error moving entity', {
            project_id,
            entity_id,
            folder_id,
          })
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'reciveEntityMove',
          entity_id,
          folder_id
        )
        return callback()
      }
    )
  },

  renameProject(project_id, newName, callback) {
    if (callback == null) {
      callback = function (err) {}
    }
    return ProjectDetailsHandler.renameProject(
      project_id,
      newName,
      function (err) {
        if (err != null) {
          OError.tag(err, 'error renaming project', {
            project_id,
            newName,
          })
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'projectNameUpdated',
          newName
        )
        return callback()
      }
    )
  },

  setCompiler(project_id, compiler, callback) {
    if (callback == null) {
      callback = function (err) {}
    }
    return ProjectOptionsHandler.setCompiler(
      project_id,
      compiler,
      function (err) {
        if (err != null) {
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'compilerUpdated',
          compiler
        )
        return callback()
      }
    )
  },

  setImageName(project_id, imageName, callback) {
    if (callback == null) {
      callback = function (err) {}
    }
    return ProjectOptionsHandler.setImageName(
      project_id,
      imageName,
      function (err) {
        if (err != null) {
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'imageNameUpdated',
          imageName
        )
        return callback()
      }
    )
  },

  setSpellCheckLanguage(project_id, languageCode, callback) {
    if (callback == null) {
      callback = function (err) {}
    }
    return ProjectOptionsHandler.setSpellCheckLanguage(
      project_id,
      languageCode,
      function (err) {
        if (err != null) {
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'spellCheckLanguageUpdated',
          languageCode
        )
        return callback()
      }
    )
  },

  setPublicAccessLevel(project_id, newAccessLevel, callback) {
    if (callback == null) {
      callback = function (err) {}
    }
    return ProjectDetailsHandler.setPublicAccessLevel(
      project_id,
      newAccessLevel,
      function (err) {
        if (err != null) {
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'project:publicAccessLevel:changed',
          { newAccessLevel }
        )
        if (newAccessLevel === PublicAccessLevels.TOKEN_BASED) {
          return ProjectDetailsHandler.ensureTokensArePresent(
            project_id,
            function (err, tokens) {
              if (err != null) {
                return callback(err)
              }
              EditorRealTimeController.emitToRoom(
                project_id,
                'project:tokens:changed',
                { tokens }
              )
              return callback()
            }
          )
        } else {
          return callback()
        }
      }
    )
  },

  setRootDoc(project_id, newRootDocID, callback) {
    if (callback == null) {
      callback = function (err) {}
    }
    return ProjectEntityUpdateHandler.setRootDoc(
      project_id,
      newRootDocID,
      function (err) {
        if (err != null) {
          return callback(err)
        }
        EditorRealTimeController.emitToRoom(
          project_id,
          'rootDocUpdated',
          newRootDocID
        )
        return callback()
      }
    )
  },

  _notifyProjectUsersOfNewFolders(project_id, folders, callback) {
    if (callback == null) {
      callback = function (error) {}
    }
    return async.eachSeries(
      folders,
      (folder, cb) =>
        EditorController._notifyProjectUsersOfNewFolder(
          project_id,
          folder.parentFolder_id,
          folder,
          null,
          cb
        ),
      callback
    )
  },

  _notifyProjectUsersOfNewFolder(
    project_id,
    folder_id,
    folder,
    userId,
    callback
  ) {
    if (callback == null) {
      callback = function (error) {}
    }
    EditorRealTimeController.emitToRoom(
      project_id,
      'reciveNewFolder',
      folder_id,
      folder,
      userId
    )
    return callback()
  },
}

EditorController.promises = promisifyAll(EditorController)
module.exports = EditorController
