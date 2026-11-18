import { smtpPrefill } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec } = sdk

export const inputSpec = InputSpec.of({
  smtp: sdk.inputSpecConstants.smtpInputSpec,
})

export const manageSmtp = sdk.Action.withInput(
  'manage-smtp',

  async () => ({
    name: i18n('Configure System Email'),
    description: i18n(
      "The mail server Keila uses for its own emails: password resets and new-account emails. Newsletters do not use it; each Keila project sends through the sender you set up in Keila's Senders page. Keila restarts to apply the change.",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Settings'),
    visibility: 'enabled',
  }),

  inputSpec,

  async () => ({
    smtp: smtpPrefill(await storeJson.read((s) => s.smtp).once()),
  }),

  async ({ effects, input }) => storeJson.merge(effects, { smtp: input.smtp }),
)
