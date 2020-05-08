export const VENDOS_WEBSOCKET_URL = 'ws://fieldcommand:3000'

export const CONSOLE_STYLES = {
  INFO: 'background: #021019; color: #03FFCF; padding: 5px 10px; border-radius: 2px',
  ERROR: 'background: #021019; color: #D44242; padding: 5px 10px; border-radius: 2px',
}

export const CONSOLE_PREFIX = 'VendOS SDK'

export const CONNECTION_ATTEMPT_INTERVAL = 100
export const CONNECTION_ATTEMPT_LIMIT = 5

export const DATA_TYPES = {

  MACHINE: 'machine',
  INSTAGRAM: 'instagram',
  DATA: 'data',
  TWITTER: 'twitter'

}

export const DEVTOOLS_URL = '[URL]'
export const DEVTOOLS_FLAG = '__VENDOS_DEVTOOLS_EXTENSION__'
export const FIELD_COMMAND_FLAG = '__VENDOS_FIELD_COMMAND_VERSION__'

export const MESSAGES = {

  WEBSOCKET_ATTEMPT: 'Attempting to connect to WebSocket on FieldCommand.',
  DEVTOOLS_ATTEMPT: 'Attempting to connect to vendOS DevTools.',
  CONNECTED_DEVTOOLS: 'Connected to vendOS DevTools.',
  CONNECTED_WEBSOCKET: `Connected to WebSocket on FieldCommand V${FIELD_COMMAND_FLAG}`,
  WEBSOCKET_CLOSED: 'WebSocket on FieldCommand was closed.',
  DEVTOOLS_CONNECTION_FAILED: `Could not connect to vendOS DevTools. If you'd like to test vendOS JS, please use the vendOS Chrome DevTools ${DEVTOOLS_URL}, and make sure you click the vendOS DevTools browserAction button in the top-right of the Chrome toolbar in order to activate them for this tab.`,
  WEBSOCKET_CONNECTION_FAILED: 'Could not connect to WebSockets. Make sure you\'re running on a machine with access to FieldCommand.'

}
