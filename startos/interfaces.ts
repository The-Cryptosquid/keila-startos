import { i18n } from './i18n'
import { primaryUrl } from './primaryUrl'
import { sdk } from './sdk'
import { uiHostId, uiInterfaceId, uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiHost = sdk.MultiHost.of(effects, uiHostId)
  const uiOrigin = await uiHost.bindPort(uiPort, { protocol: 'http' })

  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: uiInterfaceId,
    description: i18n(
      'Keila admin interface, plus the public signup forms, unsubscribe pages and images your subscribers open',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
    preferredLauncherAddress: await primaryUrl.bestUsable(effects).const(),
  })

  return [await uiOrigin.export([ui])]
})
