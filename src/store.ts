import { assert, isObject } from './utils'
import Vue from 'vue'
import { createMapState, mapToMethods } from './helpers'

// connects to vuex devtools
import devtoolPlugin from './plugins/devtool'

let gVue: Vue | null // bind on install => Vue.use(Vuex)

function unifyObjectStyle(type: any, payload: any, options: any) {
  if (isObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }

  assert(typeof type === 'string', `Expects string as the type, but found ${typeof type}.`)

  return { type, payload, options }
}

export default class Store {
  private _vm: Vue
  public mutations: object
  public plugins: Array<object>
  public subscribers: Array<object>
  private _commiting = false
  public _devtoolHook: any

  constructor(
    state: any,
    mutations: object = {},
    plugins: Array<object> = [],
    subscribers: Array<object> = []
  ) {
    this._vm = new Vue({
      data: {
        $$state: typeof state === 'function' ? state() : state
      }
    })
    this.mutations = mutations
    this.plugins = plugins
    this.subscribers = subscribers

    if (!gVue && typeof window !== 'undefined' && window.Vue) {
      install((window as any).Vue)
    }
  }

  public get state() {
    return this._vm.$data.$$state
  }

  public commit() {
    //this.call(st)
  }

  public set state(v) {
    /**
     * @todo Add deep watch for state to prevent mutations outside handlers
     * @body [not safe for production](https://vuex.vuejs.org/en/strict.html)
     */
    assert(false, `Use store.replaceState() to explicitly replace state.`)
  }

  public subscribe(sub: any) {
    this.subscribers.push(sub)
    return () => this.subscribers.splice(this.subscribers.indexOf(sub), 1)
  }

  public replaceState(state: any) {
    this._vm.$data.$$state = state
    return this
  }
}

export function install(_Vue: Vue) {
  if (gVue && _Vue === gVue) {
    assert(false, `already installed. Vue.use(Vuex) should be called only once.`)
    /* istanbul ignore next: unreachable code in test or development */
    return
  }

  gVue = _Vue

  Vue.mixin({
    beforeCreate: vuexInit
  })

  function vuexInit() {
    /*const options = this.$options;

    if (options.store) {
      // store injection
      this.$store =
        typeof options.store === "function" ? options.store() : options.store;
    } else if (options.parent && options.parent.$store) {
      // store injection for children
      this.$store = options.parent.$store;
    }*/
  }
}
