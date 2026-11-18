import { primaryUrl } from '../primaryUrl'
import { sdk } from '../sdk'
import { captcha } from './captcha'
import { exportContacts } from './exportContacts'
import { fileStorage } from './fileStorage'
import { importContacts } from './importContacts'
import { manageSmtp } from './manageSmtp'
import { setAdminPassword } from './setAdminPassword'
import { toggleRegistration } from './toggleRegistration'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(primaryUrl.action)
  .addAction(manageSmtp)
  .addAction(toggleRegistration)
  .addAction(captcha)
  .addAction(fileStorage)
  .addAction(importContacts)
  .addAction(exportContacts)
