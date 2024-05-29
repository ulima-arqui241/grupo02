import PropTypes from 'prop-types'
import { useTranslation, Trans } from 'react-i18next'
import PreviewLogsPaneEntry from './preview-logs-pane-entry'
import Icon from '../../../shared/components/icon'
import { useEditorContext } from '../../../shared/context/editor-context'
import StartFreeTrialButton from '../../../shared/components/start-free-trial-button'

function PreviewError({ name }) {
  const { hasPremiumCompile, isProjectOwner } = useEditorContext({
    isProjectOwner: PropTypes.bool,
  })

  const { t } = useTranslation()
  let errorTitle
  let errorContent

  if (name === 'error') {
    errorTitle = t('server_error')
    errorContent = <>{t('somthing_went_wrong_compiling')}</>
  } else if (name === 'renderingError') {
    errorTitle = t('pdf_rendering_error')
    errorContent = <>{t('something_went_wrong_rendering_pdf')}</>
  } else if (name === 'clsiMaintenance') {
    errorTitle = t('server_error')
    errorContent = <>{t('clsi_maintenance')}</>
  } else if (name === 'clsiUnavailable') {
    errorTitle = t('server_error')
    errorContent = <>{t('clsi_unavailable')}</>
  } else if (name === 'tooRecentlyCompiled') {
    errorTitle = t('server_error')
    errorContent = <>{t('too_recently_compiled')}</>
  } else if (name === 'compileTerminated') {
    errorTitle = t('terminated')
    errorContent = <>{t('compile_terminated_by_user')}</>
  } else if (name === 'rateLimited') {
    errorTitle = t('pdf_compile_rate_limit_hit')
    errorContent = <>{t('project_flagged_too_many_compiles')}</>
  } else if (name === 'compileInProgress') {
    errorTitle = t('pdf_compile_in_progress_error')
    errorContent = <>{t('pdf_compile_try_again')}</>
  } else if (name === 'timedout') {
    errorTitle = t('timedout')
    errorContent = (
      <>
        {t('proj_timed_out_reason')}
        <div>
          <a
            href="https://www.overleaf.com/learn/how-to/Why_do_I_keep_getting_the_compile_timeout_error_message%3F"
            target="_blank"
          >
            {t('learn_how_to_make_documents_compile_quickly')}
          </a>
        </div>
      </>
    )
  } else if (name === 'autoCompileDisabled') {
    errorTitle = t('autocompile_disabled')
    errorContent = <>{t('autocompile_disabled_reason')}</>
  } else if (name === 'projectTooLarge') {
    errorTitle = t('project_too_large')
    errorContent = <>{t('project_too_much_editable_text')}</>
  } else if (name === 'failure') {
    errorTitle = t('no_pdf_error_title')
    errorContent = (
      <>
        <Trans i18nKey="no_pdf_error_explanation" />
        <ul className="log-entry-formatted-content-list">
          <li>
            <Trans i18nKey="no_pdf_error_reason_unrecoverable_error" />
          </li>
          <li>
            <Trans
              i18nKey="no_pdf_error_reason_no_content"
              components={{ code: <code /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey="no_pdf_error_reason_output_pdf_already_exists"
              components={{ code: <code /> }}
            />
          </li>
        </ul>
      </>
    )
  }

  return errorTitle ? (
    <>
      <PreviewLogsPaneEntry
        headerTitle={errorTitle}
        formattedContent={errorContent}
        entryAriaLabel={t('compile_error_entry_description')}
        level="error"
      />
      {name === 'timedout' &&
      window.ExposedSettings.enableSubscriptions &&
      !hasPremiumCompile ? (
        <TimeoutUpgradePrompt isProjectOwner={isProjectOwner} />
      ) : null}
    </>
  ) : null
}

function TimeoutUpgradePrompt({ isProjectOwner }) {
  const { t } = useTranslation()

  const timeoutUpgradePromptContent = (
    <>
      <p>{t('free_accounts_have_timeout_upgrade_to_increase')}</p>
      <p>{t('plus_upgraded_accounts_receive')}:</p>
      <div>
        <ul className="list-unstyled">
          <li>
            <Icon type="check" />
            &nbsp;
            {t('unlimited_projects')}
          </li>
          <li>
            <Icon type="check" />
            &nbsp;
            {t('collabs_per_proj', { collabcount: 'Multiple' })}
          </li>
          <li>
            <Icon type="check" />
            &nbsp;
            {t('full_doc_history')}
          </li>
          <li>
            <Icon type="check" />
            &nbsp;
            {t('sync_to_dropbox')}
          </li>
          <li>
            <Icon type="check" />
            &nbsp;
            {t('sync_to_github')}
          </li>
          <li>
            <Icon type="check" />
            &nbsp;
            {t('compile_larger_projects')}
          </li>
        </ul>
      </div>
      {isProjectOwner ? (
        <p className="text-center">
          <StartFreeTrialButton
            source="compile-timeout"
            buttonStyle="success"
            classes={{ button: 'row-spaced-small' }}
          />
        </p>
      ) : null}
    </>
  )
  return (
    <PreviewLogsPaneEntry
      headerTitle={
        isProjectOwner
          ? t('upgrade_for_longer_compiles')
          : t('ask_proj_owner_to_upgrade_for_longer_compiles')
      }
      formattedContent={timeoutUpgradePromptContent}
      entryAriaLabel={
        isProjectOwner
          ? t('upgrade_for_longer_compiles')
          : t('ask_proj_owner_to_upgrade_for_longer_compiles')
      }
      level="success"
    />
  )
}

PreviewError.propTypes = {
  name: PropTypes.string.isRequired,
}

TimeoutUpgradePrompt.propTypes = {
  isProjectOwner: PropTypes.bool.isRequired,
}

export default PreviewError
