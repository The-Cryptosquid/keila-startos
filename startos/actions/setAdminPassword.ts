import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',

  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      "Generate a new random password for Keila's admin account. If Keila is running it restarts, and the new password is applied before it starts again.",
    ),
    warning: (await storeJson.read((s) => s.adminPassword).const(effects))
      ? i18n(
          'This replaces the current admin password, and the old one stops working.',
        )
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const adminPassword = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 24,
    })
    await storeJson.merge(effects, { adminPassword })
    const email = await storeJson.read((s) => s.adminEmail).once()

    return {
      version: '1',
      title: i18n('Keila Admin Credentials'),
      message: i18n(
        'Sign in to Keila with these credentials. If you changed the account email inside Keila, sign in with that email instead.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Email'),
            description: null,
            value: email ?? '',
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: adminPassword,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
