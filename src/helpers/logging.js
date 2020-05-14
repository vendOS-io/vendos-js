/* eslint-disable no-console */

import {CONSOLE_STYLES, CONSOLE_PREFIX} from './constants'

export const logInfo = (msg) => {

  if (console && console.info)
    console.info(`%c${CONSOLE_PREFIX}: ${msg}`, CONSOLE_STYLES.INFO)

}

export const logError = (msg) => {

  if (console && console.info)
    console.info(`%c${CONSOLE_PREFIX}: ${msg}`, CONSOLE_STYLES.ERROR)

}
