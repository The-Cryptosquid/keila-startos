import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  baseEnv,
  evalScript,
  filesFolder,
  filesMount,
  folderLocation,
  parseScriptResult,
  withFileStorage,
} from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  project: Value.text({
    name: i18n('Project'),
    description: i18n(
      'The Keila project to export, by name. Leave empty if you have only one project.',
    ),
    required: false,
    default: null,
  }),
})

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'project'

export const exportContacts = sdk.Action.withInput(
  'export-contacts',

  async () => ({
    name: i18n('Export Contacts'),
    description: i18n(
      "Save every contact in a Keila project as a CSV file in the ${folder} folder of your file service. The file has the same columns as Keila's own export, so it can be imported again.",
      { folder: filesFolder },
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Contacts'),
    visibility: 'enabled',
  }),

  inputSpec,

  async () => null,

  async ({ effects, input }) => {
    const store = await storeJson.read().once()
    if (!store) throw new Error(i18n('store.json not found'))
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
    const tmp = '/tmp/keila-export.csv'

    const { result, file } = await withFileStorage(
      effects,
      store,
      'export-contacts',
      async (sub, owner) => {
        const { stdout } = await sub.exec(evalScript('contacts.exs'), {
          env: {
            ...baseEnv(store),
            STARTOS_MODE: 'export',
            STARTOS_PROJECT: input.project ?? '',
            STARTOS_FILE: tmp,
          },
        })
        const result = parseScriptResult(stdout)
        if (!result.ok) return { result, file: '' }
        const file = `contacts-${slug(result.project)}-${stamp}.csv`
        const dest = `${filesMount}/${file}`
        await sub.execFail(['cp', tmp, dest], { user: 'root' })
        await sub.execFail(['chown', `${owner}:${owner}`, dest], {
          user: 'root',
        })
        await sub.execFail(['chmod', '644', dest], { user: 'root' })
        return { result, file }
      },
    )

    if (!result.ok) throw new Error(result.error)
    const nextcloudNote =
      store.fileStorage.service === 'nextcloud'
        ? ' ' +
          i18n(
            "Nextcloud lists files added this way only after its file cache is updated: run Nextcloud's Scan Files action to see it.",
          )
        : ''
    return {
      version: '1',
      title: i18n('Contacts Exported'),
      message:
        i18n(
          'Saved ${count} contacts from ${project} to ${file} in ${location}.',
          {
            count: result.count,
            project: result.project,
            file,
            location: folderLocation(store),
          },
        ) + nextcloudNote,
      result: null,
    }
  },
)
