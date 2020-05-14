export function getEnvironmentVariable (name) {

  const {env} = window.process || {env: {}}

  return env[name]

}

export function immutablyRemoveKeysFromObject (keys, state) {

  return Object.keys(state).filter((key) => !keys.includes(key)).reduce((acc, key) => ({

    ...acc,
    [key]: state[key]

  }), {})
}
