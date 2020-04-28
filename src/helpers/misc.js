export function immutablyRemoveKeysFromObject (keys, state) {

  return Object.keys(state).filter((key) => !keys.includes(key)).reduce((acc, key) => ({

    ...acc,
    [key]: state[key]

  }), {})
}
