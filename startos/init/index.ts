import { actions } from '../actions'
import { restoreInit } from '../backups'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { sdk } from '../sdk'
import { versionGraph } from '../versions'
import { initializeService } from './initializeService'
import { primaryUrlTask } from './primaryUrlTask'
import { watchCredentials } from './watchCredentials'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  initializeService,
  setInterfaces,
  actions,
  primaryUrlTask,
  watchCredentials,
  dependencies,
)

export const uninit = sdk.setupUninit(versionGraph)
