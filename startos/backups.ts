import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { postgresDb, postgresMount, postgresUser } from './utils'

export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.withPgDump({
    imageId: 'postgres',
    dbVolume: 'db',
    mountpoint: postgresMount,
    pgdataPath: '/data',
    database: postgresDb,
    user: postgresUser,
    password: async () => {
      const pw = await storeJson.read((s) => s.postgresPassword).once()
      if (!pw) throw new Error('No postgres password found in store.json')
      return pw
    },
  })
    .addVolume('startos')
    .addVolume('uploads'),
)
