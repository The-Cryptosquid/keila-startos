import { T } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { primaryUrl } from './primaryUrl'
import { sdk } from './sdk'
import {
  bareEmail,
  baseEnv,
  evalScript,
  keilaMounts,
  postgresDb,
  postgresMount,
  postgresUser,
  uiHostId,
  uiInterfaceId,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Keila!'))

  const store = await storeJson.read().const(effects)
  if (!store) throw new Error(i18n('store.json not found'))
  if (!store.adminPassword) {
    throw new Error(
      i18n('Run the Set Admin Password action before starting Keila.'),
    )
  }

  const url = await primaryUrl.bestUsable(effects).const()
  if (!url) {
    throw new Error(
      i18n(
        'Keila cannot start without a public address. Run the Set Public Address action, then start the service.',
      ),
    )
  }
  const publicUrl = new URL(url)

  // Every hostname the interface answers on. Keila accepts its live-page
  // WebSockets only from these origins (patches/0001), and a public one is
  // what subscribers need.
  const hostnames = await sdk.host
    .getOwn(effects, uiHostId, (host) => {
      const info =
        host?.bindings[uiPort]?.interfaces[uiInterfaceId]?.addressInfo
      const names = (hs: T.HostnameInfo[]) =>
        [...new Set(hs.map((h) => h.hostname))].sort()
      return info
        ? {
            all: names(info.nonLocal.format('hostname-info')),
            public: names(info.public.format('hostname-info')),
          }
        : { all: [], public: [] }
    })
    .const()
  const checkOrigin = hostnames.all
    .map((h) => (h.includes(':') ? `//[${h}]` : `//${h}`))
    .join(',')
  const isPublic = hostnames.public.includes(publicUrl.hostname)

  // System email: account emails and password resets. Campaigns use the
  // senders configured per project inside Keila.
  let smtp: T.SmtpValue | null = null
  if (store.smtp.selection === 'system') {
    smtp = await sdk.getSystemSmtp(effects).const()
    const customFrom = store.smtp.value.customFrom
    if (smtp && customFrom) smtp.from = customFrom
  } else if (store.smtp.selection === 'custom') {
    const { host, from, username, password, security } =
      store.smtp.value.provider.value
    smtp = {
      host,
      from,
      username,
      password: password ?? null,
      port: Number(security.value.port),
      security: security.selection,
    }
  }
  const mailerEnv: Record<string, string> = smtp
    ? {
        MAILER_SMTP_HOST: smtp.host,
        MAILER_SMTP_PORT: String(smtp.port),
        MAILER_SMTP_FROM_EMAIL: bareEmail(smtp.from),
        MAILER_SMTP_TLS_MODE: smtp.security,
        ...(smtp.username ? { MAILER_SMTP_USER: smtp.username } : {}),
        ...(smtp.password
          ? { MAILER_SMTP_PASSWORD: smtp.password }
          : { MAILER_SMTP_AUTH_METHOD: 'none' }),
      }
    : {}

  const { provider, siteKey, secretKey } = store.captcha
  const captchaEnv: Record<string, string> =
    provider !== 'none' && siteKey && secretKey
      ? {
          CAPTCHA_PROVIDER: provider,
          CAPTCHA_SITE_KEY: siteKey,
          CAPTCHA_SECRET_KEY: secretKey,
        }
      : {}

  const keilaEnv = {
    ...baseEnv(store),
    ...mailerEnv,
    ...captchaEnv,
    KEILA_USER: store.adminEmail,
    KEILA_PASSWORD: store.adminPassword,
    URL_HOST: publicUrl.hostname,
    URL_SCHEMA: publicUrl.protocol.replace(':', ''),
    URL_PORT:
      publicUrl.port || (publicUrl.protocol === 'https:' ? '443' : '80'),
    DISABLE_REGISTRATION: String(!store.registrationEnabled),
    ...(checkOrigin ? { CHECK_ORIGIN: checkOrigin } : {}),
  }

  const postgresSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'db',
      subpath: null,
      mountpoint: postgresMount,
      readonly: false,
    }),
    'postgres-sub',
  )

  const keilaSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'keila' },
    keilaMounts,
    'keila-sub',
  )

  return sdk.Daemons.of(effects)
    .addDaemon('postgres', {
      subcontainer: postgresSub,
      exec: {
        command: sdk.useEntrypoint(['-c', 'listen_addresses=127.0.0.1']),
        env: {
          POSTGRES_USER: postgresUser,
          POSTGRES_PASSWORD: store.postgresPassword ?? '',
          POSTGRES_DB: postgresDb,
        },
      },
      ready: {
        display: i18n('Database'),
        fn: async () => {
          const { exitCode } = await postgresSub.exec([
            'pg_isready',
            '-U',
            postgresUser,
            '-d',
            postgresDb,
            '-h',
            '127.0.0.1',
          ])
          return exitCode === 0
            ? { result: 'success', message: i18n('PostgreSQL is ready') }
            : {
                result: 'starting',
                message: i18n('Waiting for PostgreSQL to be ready'),
              }
        },
      },
      requires: [],
    })
    .addOneshot('apply-admin-password', {
      subcontainer: keilaSub,
      exec: { command: evalScript('admin.exs'), env: keilaEnv },
      requires: ['postgres'],
    })
    .addDaemon('keila', {
      subcontainer: keilaSub,
      exec: { command: sdk.useEntrypoint(), env: keilaEnv },
      ready: {
        display: i18n('Web Interface'),
        // The first start migrates the database before Keila listens.
        gracePeriod: 180_000,
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            effects,
            `http://127.0.0.1:${uiPort}/auth/login`,
            {
              successMessage: i18n('The web interface is ready'),
              errorMessage: i18n('The web interface is not ready'),
            },
          ),
      },
      requires: ['apply-admin-password'],
    })
    .addHealthCheck('public-address', {
      ready: {
        display: i18n('Public Address'),
        fn: async () =>
          isPublic
            ? {
                result: 'success',
                message: i18n('Links in your emails use ${url}', { url }),
              }
            : {
                result: 'failure',
                message: i18n(
                  'Links in your emails use ${url}, which subscribers cannot open. Set up a public domain (StartTunnel or port forwarding), then choose it with the Set Public Address action.',
                  { url },
                ),
              },
      },
      requires: ['keila'],
    })
    .addHealthCheck('system-email', {
      ready: {
        display: i18n('System Email'),
        fn: async () =>
          smtp
            ? {
                result: 'success',
                message: i18n(
                  'Account and password-reset emails are sent from ${from}',
                  { from: bareEmail(smtp.from) },
                ),
              }
            : {
                result: 'disabled',
                message: i18n(
                  'Keila cannot send account or password-reset emails. Use the Configure System Email action to enable them. Campaigns are unaffected; they use the senders you set up in each project.',
                ),
              },
      },
      requires: ['keila'],
    })
})
