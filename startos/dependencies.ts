import { T } from '@start9labs/start-sdk'
import { FileService, storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'

// Each file service is a dependency only while it is the one chosen in the
// File Storage action. `exists` is enough: the import and export actions
// mount its volume, they do not talk to the running service.
const selected =
  (id: FileService) =>
  async ({ effects }: { effects: T.Effects }) =>
    (await storeJson.read((s) => s.fileStorage.service).const(effects)) === id

export const dependencies = sdk.Dependencies.of()
  .addDependency(
    sdk.Dependency.optional('nextexplorer', {
      description: i18n(
        'Holds the Keila folder for contact imports and exports',
      ),
      metadata: {
        title: 'NextExplorer',
        icon: 'https://raw.githubusercontent.com/Start9Labs/nextexplorer-startos/04f7ecbfc31ad2205e0222dd7568fb881aa06c79/icon.svg',
      },
      // Add Location became callable by dependents in this release.
      versionRange: '>=4.0.1:2',
      kind: 'exists',
      enabled: selected('nextexplorer'),
    }),
  )
  .addDependency(
    sdk.Dependency.optional('filebrowser', {
      description: i18n(
        'Holds the Keila folder for contact imports and exports',
      ),
      metadata: {
        title: 'FileBrowser Quantum',
        icon: 'https://raw.githubusercontent.com/Start9Labs/filebrowser-quantum-startos/e936a6c85a97b930b43cad5e9c0dd4898a2df567/icon.svg',
      },
      versionRange: '>=#quantum:2.0.2-stable:3',
      kind: 'exists',
      enabled: selected('filebrowser'),
    }),
  )
  .addDependency(
    sdk.Dependency.optional('nextcloud', {
      description: i18n(
        'Holds the Keila folder for contact imports and exports',
      ),
      metadata: {
        title: 'Nextcloud',
        icon: 'https://raw.githubusercontent.com/Start9Labs/nextcloud-startos/f5025c524301aebe62d9a79ad720223b053e1bf2/icon.svg',
      },
      versionRange: '>=33.0.6:1',
      kind: 'exists',
      enabled: selected('nextcloud'),
    }),
  )
