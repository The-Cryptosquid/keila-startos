import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiHostId, uiInterfaceId } from './utils'

export const primaryUrl = sdk.setupPrimaryUrl({
  id: 'set-primary-url',
  hostId: uiHostId,
  interfaceId: uiInterfaceId,
  metadata: {
    name: i18n('Set Public Address'),
    description: i18n(
      'Choose the address Keila puts in every link it sends: unsubscribe and confirmation links, signup forms, tracking links and images. Subscribers must be able to open it from the internet, so pick a public domain. Keila restarts to apply the change.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  field: {
    name: i18n('Public address'),
    description: i18n(
      'Only a public domain (set up with StartTunnel or port forwarding) works for subscribers. A .local, IP or .onion address works only for you.',
    ),
  },
  get: storeJson.read((s) => s.url),
  set: (effects, url) => storeJson.merge(effects, { url }),
  fallback: false,
})
