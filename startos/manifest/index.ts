import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'keila',
  title: 'Keila',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/The-Cryptosquid/keila-startos',
  upstreamRepo: 'https://github.com/pentacent/keila',
  marketingUrl: 'https://www.keila.io/',
  donationUrl: 'https://github.com/sponsors/pentacent',
  description: { short, long },
  volumes: ['startos', 'uploads', 'db'],
  images: {
    // Built from the `keila` submodule: upstream's pentacent/keila image is amd64-only.
    keila: {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissing: false,
    },
    postgres: {
      source: { dockerTag: 'postgres:17.12-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
