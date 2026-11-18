import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { filesFolder } from '../utils'

const { InputSpec, Value, Variants } = sdk

export const inputSpec = InputSpec.of({
  service: Value.union({
    name: i18n('File service'),
    description: i18n(
      "Where Keila keeps its ${folder} folder for contact imports and exports. NextExplorer is recommended: its ${folder} location also shows up in Nextcloud through Nextcloud's External Storage action.",
      { folder: filesFolder },
    ),
    default: 'nextexplorer',
    variants: Variants.of({
      none: { name: i18n('None'), spec: InputSpec.of({}) },
      nextexplorer: { name: 'NextExplorer', spec: InputSpec.of({}) },
      filebrowser: { name: 'FileBrowser Quantum', spec: InputSpec.of({}) },
      nextcloud: {
        name: 'Nextcloud',
        spec: InputSpec.of({
          user: Value.text({
            name: i18n('Nextcloud username'),
            description: i18n(
              'The login name of the Nextcloud user whose files hold the ${folder} folder.',
              { folder: filesFolder },
            ),
            required: true,
            default: null,
            patterns: [
              {
                regex: '^[A-Za-z0-9_.@-]+$',
                description: i18n(
                  'Letters, digits and the characters _ . @ - only',
                ),
              },
            ],
          }),
        }),
      },
    }),
  }),
})

export const fileStorage = sdk.Action.withInput(
  'file-storage',

  async () => ({
    name: i18n('File Storage'),
    description: i18n(
      'Choose the file service (NextExplorer, FileBrowser Quantum or Nextcloud) that holds the ${folder} folder used by Import Contacts and Export Contacts. Keila reads and writes only inside that folder.',
      { folder: filesFolder },
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Contacts'),
    visibility: 'enabled',
  }),

  inputSpec,

  async () => {
    const fs = await storeJson.read((s) => s.fileStorage).once()
    if (fs?.service === 'nextcloud') {
      return {
        service: {
          selection: 'nextcloud' as const,
          value: { user: fs.nextcloudUser ?? '' },
        },
      }
    }
    return {
      service: {
        selection: fs?.service ?? 'nextexplorer',
        value: {},
      },
    }
  },

  async ({ effects, input }) => {
    const { selection } = input.service
    await storeJson.merge(effects, {
      fileStorage: {
        service: selection,
        nextcloudUser:
          input.service.selection === 'nextcloud'
            ? input.service.value.user
            : null,
      },
    })
  },
)
