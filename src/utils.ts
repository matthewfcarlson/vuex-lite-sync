const SHOULD_THROW = process.env.NODE_ENV !== 'production'

export function assert(condition: Boolean, msg: String) {
  if (!condition) {
    if (SHOULD_THROW) throw new Error(`[vuex] ${msg}`)
    else console.error(`[vuex] ${msg}`)
  }
}

export function isObject(obj: Object | null) {
  return obj !== null && typeof obj === 'object'
}
/**
 * forEach for object
 */
export function forEachValue(obj: any, fn: (val: any, key: string) => void) {
  Object.keys(obj).forEach(key => fn(obj[key], key))
}

export function isPromise(val: Promise<any> | any) {
  return val && typeof val.then === 'function'
}

export function partial<S>(fn: (val: S) => void, arg: S) {
  return function() {
    return fn(arg)
  }
}
