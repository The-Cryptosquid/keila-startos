import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const toggleRegistration = sdk.Action.withoutInput(
  'toggle-registration',

  async ({ effects }) => {
    const enabled = await storeJson
      .read((s) => s.registrationEnabled)
      .const(effects)
    return {
      name: enabled
        ? i18n('Disable Public Signups')
        : i18n('Enable Public Signups'),
      description: enabled
        ? i18n(
            'Anyone who can reach Keila can currently create an account. Turn this off once everyone who needs an account has one. Keila restarts to apply the change.',
          )
        : i18n(
            'Let anyone who can reach Keila create their own account. Off by default: as the admin you can add accounts from the Users page in Keila instead. Keila restarts to apply the change.',
          ),
      warning: enabled
        ? null
        : i18n(
            'With a public address, anyone on the internet can create an account and send email through your senders.',
          ),
      allowedStatuses: 'any',
      group: i18n('Settings'),
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const enabled = await storeJson.read((s) => s.registrationEnabled).once()
    await storeJson.merge(effects, { registrationEnabled: !enabled })
  },
)
