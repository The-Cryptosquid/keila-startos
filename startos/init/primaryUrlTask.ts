import { i18n } from '../i18n'
import { primaryUrl } from '../primaryUrl'

export const primaryUrlTask = primaryUrl.setupTask('critical', {
  reason: i18n(
    'Choose the public address Keila uses in every email link. Keila does not run until one is chosen.',
  ),
})
