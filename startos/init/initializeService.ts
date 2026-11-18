import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    await storeJson.merge(effects, {
      postgresPassword: utils.getDefaultString({
        charset: 'a-z,A-Z,0-9',
        len: 32,
      }),
      // Keila requires at least 64 characters.
      secretKeyBase: utils.getDefaultString({
        charset: 'a-z,A-Z,0-9',
        len: 96,
      }),
    })
  } else {
    await storeJson.merge(effects, {})
  }
})
