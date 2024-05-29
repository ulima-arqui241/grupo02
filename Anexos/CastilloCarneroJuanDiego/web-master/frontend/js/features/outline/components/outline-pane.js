import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import OutlineRoot from './outline-root'
import Icon from '../../../shared/components/icon'
import localStorage from '../../../infrastructure/local-storage'
import withErrorBoundary from '../../../infrastructure/error-boundary'
import { useProjectContext } from '../../../shared/context/project-context'

const OutlinePane = React.memo(function OutlinePane({
  isTexFile,
  outline,
  jumpToLine,
  onToggle,
  eventTracking,
  highlightedLine,
}) {
  const { t } = useTranslation()

  const { _id: projectId } = useProjectContext({
    _id: PropTypes.string.isRequired,
  })

  const storageKey = `file_outline.expanded.${projectId}`
  const [expanded, setExpanded] = useState(() => {
    const storedExpandedState = localStorage.getItem(storageKey) !== false
    return storedExpandedState
  })
  const isOpen = isTexFile && expanded

  useEffect(() => {
    onToggle(isOpen)
  }, [isOpen, onToggle])

  const headerClasses = classNames('outline-pane', {
    'outline-pane-disabled': !isTexFile,
  })

  function handleExpandCollapseClick() {
    if (isTexFile) {
      localStorage.setItem(storageKey, !expanded)
      eventTracking.sendMB(expanded ? 'outline-collapse' : 'outline-expand')
      setExpanded(!expanded)
    }
  }

  return (
    <div className={headerClasses}>
      <header className="outline-header">
        <button
          className="outline-header-expand-collapse-btn"
          disabled={!isTexFile}
          onClick={handleExpandCollapseClick}
          aria-label={expanded ? t('hide_outline') : t('show_outline')}
        >
          <Icon
            type={isOpen ? 'angle-down' : 'angle-right'}
            classes={{ icon: 'outline-caret-icon' }}
          />
          <h4 className="outline-header-name">{t('file_outline')}</h4>
        </button>
      </header>
      {expanded && isTexFile ? (
        <div className="outline-body">
          <OutlineRoot
            outline={outline}
            jumpToLine={jumpToLine}
            highlightedLine={highlightedLine}
          />
        </div>
      ) : null}
    </div>
  )
})

OutlinePane.propTypes = {
  isTexFile: PropTypes.bool.isRequired,
  outline: PropTypes.array.isRequired,
  jumpToLine: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  eventTracking: PropTypes.object.isRequired,
  highlightedLine: PropTypes.number,
}

export default withErrorBoundary(OutlinePane)
