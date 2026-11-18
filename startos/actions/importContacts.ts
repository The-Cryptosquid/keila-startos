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
  file: Value.text({
    name: i18n('CSV file'),
    description: i18n(
      "Name of the CSV file in the ${folder} folder, for example subscribers.csv. Columns: Email, First name, Last name (the names may be empty). A file from Export Contacts or from Keila's own export works as-is.",
      { folder: filesFolder },
    ),
    required: true,
    default: null,
    placeholder: 'subscribers.csv',
    patterns: [
      {
        regex: '^[^/\\\\]+\\.csv$',
        description: i18n('A file name ending in .csv, without folders'),
      },
    ],
  }),
  project: Value.text({
    name: i18n('Project'),
    description: i18n(
      'The Keila project to import into, by name. Leave empty if you have only one project.',
    ),
    required: false,
    default: null,
  }),
  onConflict: Value.select({
    name: i18n('Existing contacts'),
    description: i18n(
      'What to do when an email address in the file is already a contact in the project.',
    ),
    default: 'replace',
    values: {
      replace: i18n('Update them with the names in the file'),
      ignore: i18n('Leave them unchanged'),
    },
  }),
})

export const importContacts = sdk.Action.withInput(
  'import-contacts',

  async () => ({
    name: i18n('Import Contacts'),
    description: i18n(
      'Add the contacts in a CSV file from your file service to a Keila project. Put the file in the ${folder} folder first.',
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
    const file = input.file.trim()

    const result = await withFileStorage(
      effects,
      store,
      'import-contacts',
      async (sub) => {
        const path = `${filesMount}/${file}`
        if ((await sub.exec(['test', '-f', path])).exitCode !== 0) {
          throw new Error(
            i18n('There is no ${file} in ${location}.', {
              file,
              location: folderLocation(store),
            }),
          )
        }
        const { stdout } = await sub.exec(evalScript('contacts.exs'), {
          env: {
            ...baseEnv(store),
            STARTOS_MODE: 'import',
            STARTOS_PROJECT: input.project ?? '',
            STARTOS_FILE: path,
            STARTOS_ON_CONFLICT: input.onConflict,
          },
        })
        return parseScriptResult(stdout)
      },
    )

    if (!result.ok) throw new Error(result.error)
    return {
      version: '1',
      title: i18n('Contacts Imported'),
      message: i18n(
        'Imported ${file} into ${project}: ${count} new contacts. The project now has ${total} contacts.',
        {
          file,
          project: result.project,
          count: result.count,
          total: result.total ?? result.count,
        },
      ),
      result: null,
    }
  },
)
