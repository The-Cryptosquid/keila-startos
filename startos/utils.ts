import { manifest as filebrowserManifest } from 'filebrowser-quantum-startos/startos/manifest'
import { manifest as nextcloudManifest } from 'nextcloud-startos/startos/manifest'
import { manifest as nextexplorerManifest } from 'nextexplorer-startos/startos/manifest'
import { T } from '@start9labs/start-sdk'
import { FileService, Store } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'

export const uiPort = 4000
export const uiHostId = 'ui'
export const uiInterfaceId = 'ui'

export const postgresPort = 5432
export const postgresUser = 'keila'
export const postgresDb = 'keila'
export const postgresMount = '/var/lib/postgresql'

export const keilaBin = '/opt/app/bin/keila'
export const uploadsPath = '/opt/app/uploads'
export const assetsPath = '/opt/startos'
export const filesMount = '/mnt/files'

// The folder Keila keeps in the selected file service. In NextExplorer it is a
// location of its own, so Nextcloud's External Storage shows it too.
export const filesFolder = 'Keila'

export const keilaMounts = sdk.Mounts.of()
  .mountVolume({
    volumeId: 'uploads',
    subpath: null,
    mountpoint: uploadsPath,
    readonly: false,
  })
  .mountAssets({ subpath: null, mountpoint: assetsPath })

/**
 * Environment every `bin/keila` invocation needs. Keila's runtime config halts
 * without a database, a secret key and a system mailer, even for `eval`, so the
 * mailer here is a placeholder; main.ts replaces it with the real one.
 */
export const baseEnv = (store: Store): Record<string, string> => {
  if (!store.postgresPassword || !store.secretKeyBase) {
    throw new Error(i18n('Internal secrets are missing from store.json'))
  }
  return {
    DB_URL: `postgres://${postgresUser}:${store.postgresPassword}@127.0.0.1:${postgresPort}/${postgresDb}`,
    SECRET_KEY_BASE: store.secretKeyBase,
    USER_CONTENT_DIR: uploadsPath,
    DISABLE_UPDATE_CHECKS: 'true',
    ...placeholderMailer(store.adminEmail),
  }
}

/** A mailer that accepts the config and delivers nothing (nothing listens on port 25). */
export const placeholderMailer = (from: string): Record<string, string> => ({
  MAILER_SMTP_HOST: '127.0.0.1',
  MAILER_SMTP_PORT: '25',
  MAILER_SMTP_AUTH_METHOD: 'none',
  MAILER_SMTP_TLS_MODE: 'none',
  MAILER_SMTP_FROM_EMAIL: from,
})

/** `Name <user@example.com>` → `user@example.com`; Keila wants a bare address. */
export const bareEmail = (from: string) =>
  (from.match(/<([^>]+)>/)?.[1] ?? from).trim()

export const evalScript = (script: string): [string, ...string[]] => [
  keilaBin,
  'eval',
  `Code.eval_file("${assetsPath}/${script}")`,
]

const owners: Record<Exclude<FileService, 'none'>, number> = {
  // NextExplorer and FileBrowser Quantum own their data as uid 1000,
  // Nextcloud as www-data (uid 33 in its Debian-based image).
  nextexplorer: 1000,
  filebrowser: 1000,
  nextcloud: 33,
}

export const fileServiceNames: Record<FileService, string> = {
  none: 'None',
  nextexplorer: 'NextExplorer',
  filebrowser: 'FileBrowser Quantum',
  nextcloud: 'Nextcloud',
}

/** Where the Keila folder sits, as the user sees it in the file service. */
export const folderLocation = (store: Store) => {
  const { service, nextcloudUser } = store.fileStorage
  if (service === 'nextexplorer')
    return i18n('the ${folder} location in NextExplorer', {
      folder: filesFolder,
    })
  if (service === 'filebrowser')
    return i18n('the ${folder} folder in FileBrowser Quantum', {
      folder: filesFolder,
    })
  return i18n("the ${folder} folder in ${user}'s Nextcloud files", {
    folder: filesFolder,
    user: nextcloudUser ?? '',
  })
}

/**
 * Run `fn` in a temporary Keila container with the Keila folder of the selected
 * file service mounted read-write at `filesMount`, creating the folder first.
 * Files `fn` creates must be handed to the returned owner uid.
 */
export async function withFileStorage<R>(
  effects: T.Effects,
  store: Store,
  name: string,
  fn: (
    sub: Parameters<Parameters<typeof sdk.SubContainer.withTemp>[4]>[0],
    owner: number,
  ) => Promise<R>,
): Promise<R> {
  const { service, nextcloudUser } = store.fileStorage
  if (service === 'none') {
    throw new Error(
      i18n(
        'No file service is selected. Run the File Storage action to choose NextExplorer, FileBrowser Quantum or Nextcloud.',
      ),
    )
  }
  if (!(await sdk.getInstalledPackages(effects)).includes(service)) {
    throw new Error(
      i18n(
        '${service} is not installed. Install it, or choose another service with the File Storage action.',
        { service: fileServiceNames[service] },
      ),
    )
  }

  let mounts = keilaMounts
  if (service === 'nextexplorer') {
    // NextExplorer's own action creates the location (owned by uid 1000), and
    // treats an existing one as success when a dependent asks.
    await sdk.action.run({
      effects,
      packageId: 'nextexplorer',
      actionId: 'add-location',
      input: ({ value }: { value: Record<string, unknown> | null }) => ({
        ...value,
        name: filesFolder,
      }),
    })
    mounts = mounts.mountDependency<typeof nextexplorerManifest>({
      dependencyId: 'nextexplorer',
      volumeId: 'data',
      subpath: filesFolder,
      mountpoint: filesMount,
      readonly: false,
    })
  } else if (service === 'filebrowser') {
    mounts = mounts.mountDependency<typeof filebrowserManifest>({
      dependencyId: 'filebrowser',
      volumeId: 'data',
      subpath: filesFolder,
      mountpoint: filesMount,
      readonly: false,
    })
  } else {
    if (!nextcloudUser) {
      throw new Error(
        i18n('Run the File Storage action and enter your Nextcloud username.'),
      )
    }
    const userFiles = `data/${nextcloudUser}/files`
    // A read-only mount of a missing subpath fails, so this proves the user
    // exists before the read-write mount below could create a stray folder.
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'keila' },
      sdk.Mounts.of().mountDependency<typeof nextcloudManifest>({
        dependencyId: 'nextcloud',
        volumeId: 'nextcloud',
        subpath: userFiles,
        mountpoint: filesMount,
        readonly: true,
      }),
      'nextcloud-user-check',
      async () => null,
    ).catch(() => {
      throw new Error(
        i18n(
          'Nextcloud has no files for a user named ${user}. Check the username in the File Storage action; it is the login name, not the display name.',
          { user: nextcloudUser },
        ),
      )
    })
    mounts = mounts.mountDependency<typeof nextcloudManifest>({
      dependencyId: 'nextcloud',
      volumeId: 'nextcloud',
      subpath: `${userFiles}/${filesFolder}`,
      mountpoint: filesMount,
      readonly: false,
    })
  }

  const owner = owners[service]
  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'keila' },
    mounts,
    name,
    async (sub) => {
      await sub.execFail(['chown', `${owner}:${owner}`, filesMount], {
        user: 'root',
      })
      return fn(sub, owner)
    },
  )
}

/** Run `fn` with `subpath` of a file service's volume mounted read-only; `null` if it does not exist. */
async function peekFolder<R>(
  effects: T.Effects,
  service: Exclude<FileService, 'none'>,
  subpath: string,
  fn: (
    sub: Parameters<Parameters<typeof sdk.SubContainer.withTemp>[4]>[0],
  ) => Promise<R>,
): Promise<R | null> {
  // A read-only mount of a missing subpath fails instead of creating it, so
  // looking never leaves a folder behind.
  const mounts =
    service === 'nextexplorer'
      ? sdk.Mounts.of().mountDependency<typeof nextexplorerManifest>({
          dependencyId: 'nextexplorer',
          volumeId: 'data',
          subpath,
          mountpoint: filesMount,
          readonly: true,
        })
      : service === 'filebrowser'
        ? sdk.Mounts.of().mountDependency<typeof filebrowserManifest>({
            dependencyId: 'filebrowser',
            volumeId: 'data',
            subpath,
            mountpoint: filesMount,
            readonly: true,
          })
        : sdk.Mounts.of().mountDependency<typeof nextcloudManifest>({
            dependencyId: 'nextcloud',
            volumeId: 'nextcloud',
            subpath,
            mountpoint: filesMount,
            readonly: true,
          })
  let mounted = false
  try {
    return await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'keila' },
      mounts,
      'file-storage-check',
      async (sub) => {
        mounted = true
        return fn(sub)
      },
    )
  } catch (e) {
    if (!mounted) return null
    throw e
  }
}

/**
 * The File Storage health check: the chosen service is installed and its
 * Keila folder exists, is a folder, and is owned by the user that service
 * runs as. Read-only; it never creates or changes anything.
 */
export async function checkFileStorage(
  effects: T.Effects,
  store: Store,
): Promise<T.NamedHealthCheckResultKindInput> {
  const { service, nextcloudUser } = store.fileStorage
  if (service === 'none') {
    return {
      result: 'disabled',
      message: i18n(
        'No file service is chosen, so Import Contacts and Export Contacts cannot run. Choose one with the File Storage action.',
      ),
    }
  }
  const name = fileServiceNames[service]
  if (!(await sdk.getInstalledPackages(effects)).includes(service)) {
    return {
      result: 'failure',
      message: i18n(
        '${service} is not installed. Install it, or choose another service with the File Storage action.',
        { service: name },
      ),
    }
  }
  if (service === 'nextcloud' && !nextcloudUser) {
    return {
      result: 'failure',
      message: i18n(
        'Run the File Storage action and enter your Nextcloud username.',
      ),
    }
  }

  const userFiles = `data/${nextcloudUser}/files`
  const subpath =
    service === 'nextcloud' ? `${userFiles}/${filesFolder}` : filesFolder
  const location = folderLocation(store)
  const found = await peekFolder(effects, service, subpath, async (sub) => {
    const { exitCode, stdout } = await sub.exec(
      ['sh', '-c', `test -d ${filesMount} && stat -c %u ${filesMount}`],
      { user: 'root' },
    )
    return exitCode === 0 ? Number(stdout.toString().trim()) : NaN
  })

  if (found === null) {
    if (
      service === 'nextcloud' &&
      (await peekFolder(effects, service, userFiles, async () => true)) === null
    ) {
      return {
        result: 'failure',
        message: i18n(
          'Nextcloud has no files for a user named ${user}. Check the username in the File Storage action; it is the login name, not the display name.',
          { user: nextcloudUser ?? '' },
        ),
      }
    }
    return {
      result: 'failure',
      message: i18n(
        'Keila cannot find ${location}. Run the File Storage action again to create it.',
        { location, folder: filesFolder, service: name },
      ),
    }
  }
  if (Number.isNaN(found)) {
    return {
      result: 'failure',
      message: i18n(
        'Keila expected ${location} but found a file with that name. Rename or remove it in ${service}, then run the File Storage action again.',
        { location, folder: filesFolder, service: name },
      ),
    }
  }
  if (found !== owners[service]) {
    return {
      result: 'failure',
      message: i18n(
        'Keila can reach ${location}, but it has the wrong owner, so ${service} may not be able to change the files Keila writes there. Run the File Storage action again to repair it.',
        { location, folder: filesFolder, service: name },
      ),
    }
  }
  return {
    result: 'success',
    message: i18n('Imports and exports use ${location}', { location }),
  }
}

export type ScriptResult =
  | { ok: true; project: string; count: number; total?: number }
  | { ok: false; error: string }

/** The `STARTOS_RESULT {json}` line contacts.exs prints. */
export const parseScriptResult = (stdout: string | Buffer): ScriptResult => {
  const line = stdout
    .toString()
    .split('\n')
    .find((l) => l.startsWith('STARTOS_RESULT '))
  if (!line) {
    throw new Error(
      i18n('Keila did not report a result. Check the service logs.'),
    )
  }
  return JSON.parse(line.slice('STARTOS_RESULT '.length))
}
