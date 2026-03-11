import { useMemo, useEffect, useState, useCallback } from 'react';
import Form from '@rjsf/core';
import type { IChangeEvent } from '@rjsf/core';
import { RJSFValidationError } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useTranslation } from 'react-i18next';
import { BaseCodingAgent } from 'shared/types';
import { settingsRjsfTheme } from './rjsf/theme';
import { SettingsSaveBar } from './SettingsComponents';

/** Default base commands per executor (for placeholder only). Override via base_command_override to pin version. Matches Rust defaults. */
const DEFAULT_BASE_COMMAND_PLACEHOLDERS: Record<BaseCodingAgent, string> = {
  [BaseCodingAgent.AMP]: 'npx -y @sourcegraph/amp@latest',
  [BaseCodingAgent.AUGGIE]: 'npx -y @augmentcode/auggie@0.18.1',
  [BaseCodingAgent.CLAUDE_CODE]: 'npx -y @anthropic-ai/claude-code@2.1.32',
  [BaseCodingAgent.CLINE]: 'npx -y cline@2.6.1',
  [BaseCodingAgent.CODEX]: 'npx -y @openai/codex@0.98.0',
  [BaseCodingAgent.COPILOT]: 'npx -y @github/copilot@0.0.403',
  [BaseCodingAgent.CURSOR_AGENT]: 'cursor-agent',
  [BaseCodingAgent.DROID]: 'droid exec',
  [BaseCodingAgent.FAST_AGENT]: 'uvx fast-agent-acp==0.5.9',
  [BaseCodingAgent.GEMINI]: 'npx -y @google/gemini-cli@0.27.0',
  [BaseCodingAgent.GOOSE]: 'goose',
  [BaseCodingAgent.JUNIE]: 'npx -y @jetbrains/junie@888.180.0',
  [BaseCodingAgent.KILO]: 'npx -y @kilocode/cli@7.0.41',
  [BaseCodingAgent.KIMI]: 'npx -y @kimi-dev/kimi@1.18.0',
  [BaseCodingAgent.MISTRAL_VIBE]: 'uvx mistral-vibe',
  [BaseCodingAgent.NOVA]: 'npx -y @compass-ai/nova@1.0.76',
  [BaseCodingAgent.OPENCODE]: 'npx -y opencode-ai@1.2.24',
  [BaseCodingAgent.QODER]: 'npx -y @qoder-ai/qodercli@0.1.30',
  [BaseCodingAgent.QWEN_CODE]: 'npx -y @qwen-code/qwen-code@0.9.1',
  [BaseCodingAgent.STAKPAK]: 'stakpak',
};

interface ExecutorConfigFormProps {
  executor: BaseCodingAgent;
  value: unknown;
  onChange?: (formData: unknown) => void;
  onSave?: (formData: unknown) => Promise<void>;
  onDiscard?: () => void;
  disabled?: boolean;
  saving?: boolean;
  isDirty?: boolean;
}

import schemas from 'virtual:executor-schemas';

export function ExecutorConfigForm({
  executor,
  value,
  onChange,
  onSave,
  onDiscard,
  disabled = false,
  saving = false,
  isDirty = false,
}: ExecutorConfigFormProps) {
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState<unknown>(value || {});
  const [validationErrors, setValidationErrors] = useState<
    RJSFValidationError[]
  >([]);

  const schema = useMemo(() => {
    return schemas[executor];
  }, [executor]);

  // Custom handler for env field updates
  const handleEnvChange = useCallback(
    (envData: Record<string, string> | undefined) => {
      const newFormData = {
        ...(formData as Record<string, unknown>),
        env: envData,
      };
      setFormData(newFormData);
      if (onChange) {
        onChange(newFormData);
      }
    },
    [formData, onChange]
  );

  const uiSchema = useMemo(
    () => ({
      env: {
        'ui:field': 'KeyValueField',
      },
      base_command_override: {
        'ui:placeholder': DEFAULT_BASE_COMMAND_PLACEHOLDERS[executor],
      },
    }),
    [executor]
  );

  // Pass the env update handler via formContext
  const formContext = useMemo(
    () => ({
      onEnvChange: handleEnvChange,
    }),
    [handleEnvChange]
  );

  useEffect(() => {
    setFormData(value || {});
    setValidationErrors([]);
  }, [value, executor]);

  const handleChange = (event: IChangeEvent<unknown>) => {
    const newFormData = event.formData;
    setFormData(newFormData);
    if (onChange) {
      onChange(newFormData);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(formData);
    }
  };

  const handleError = (errors: RJSFValidationError[]) => {
    setValidationErrors(errors);
  };

  if (!schema) {
    return (
      <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
        {t('settings.agents.errors.schemaNotFound', { executor })}
      </div>
    );
  }

  const hasValidationErrors = validationErrors.length > 0;

  return (
    <div className="space-y-4">
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        formContext={formContext}
        onChange={handleChange}
        onError={handleError}
        validator={validator}
        disabled={disabled}
        liveValidate
        showErrorList={false}
        widgets={settingsRjsfTheme.widgets}
        templates={settingsRjsfTheme.templates}
        fields={settingsRjsfTheme.fields}
      >
        {/* No submit button - SettingsSaveBar handles saving */}
        <></>
      </Form>

      {hasValidationErrors && (
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>
                {error.property}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onSave && (
        <SettingsSaveBar
          show={isDirty}
          saving={saving}
          saveDisabled={hasValidationErrors}
          unsavedMessage={t('settings.agents.save.unsavedChanges')}
          onSave={handleSave}
          onDiscard={onDiscard}
        />
      )}
    </div>
  );
}
