import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const fileServices = [
  'none',
  'nextexplorer',
  'filebrowser',
  'nextcloud',
] as const
export type FileService = (typeof fileServices)[number]

const shape = z.looseObject({
  // Database credential for Keila and for the pg_dump backup. Regenerating it
  // locks both out of the existing database.
  postgresPassword: z.string().optional().catch(undefined),
  // Keila's SECRET_KEY_BASE. It signs sessions and every unsubscribe, opt-in
  // and tracking link already sent, and derives the project id salt, so it
  // must never change after install.
  secretKeyBase: z.string().optional().catch(undefined),
  // Email of the root account Keila creates on its first start.
  adminEmail: z.string().catch('admin@keila.local'),
  // Unset until the Set Admin Password action runs; Keila does not start without it.
  adminPassword: z.string().optional().catch(undefined),
  // The URL chosen with the Set Public Address action.
  url: z.string().catch(''),
  registrationEnabled: z.boolean().catch(false),
  smtp: smtpShape,
  captcha: z
    .looseObject({
      provider: z.enum(['none', 'hcaptcha', 'friendly_captcha']).catch('none'),
      siteKey: z.string().nullable().catch(null),
      secretKey: z.string().nullable().catch(null),
    })
    .catch({ provider: 'none', siteKey: null, secretKey: null }),
  fileStorage: z
    .looseObject({
      service: z.enum(fileServices).catch('none'),
      nextcloudUser: z.string().nullable().catch(null),
    })
    .catch({ service: 'none', nextcloudUser: null }),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)

export type Store = z.infer<typeof shape>
