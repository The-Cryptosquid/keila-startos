import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.40.2:0',
  releaseNotes: {
    en_US: 'Initial release of Keila for StartOS.',
    es_ES: 'Primera versión de Keila para StartOS.',
    de_DE: 'Erste Veröffentlichung von Keila für StartOS.',
    pl_PL: 'Pierwsze wydanie Keila dla StartOS.',
    fr_FR: 'Première version de Keila pour StartOS.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
