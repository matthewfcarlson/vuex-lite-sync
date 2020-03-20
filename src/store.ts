import { assert, isObject } from './utils'
import Vue from 'vue'
import { createMapState, mapToMethods } from './helpers'

// connects to vuex devtools
import devtoolPlugin from './plugins/devtool'

let gVue: Vue | null // bind on install => Vue.use(Vuex)

export type vuex_mutations = { [key: string]: vuex_mutation }

export type vuex_mutation = (state: vuex_state, payload: vuex_payload) => void
export interface vuex_mutation_data {
  type: vuex_commit_type
  payload: vuex_payload
}
export type vuex_subscriber = (mutation: vuex_mutation_data, state: vuex_state) => void
export type vuex_state = any
export type vuex_payload = any
export type vuex_plugin = (store: Store) => void
export type vuex_commit_type = string | vuex_commit_object
export interface vuex_commit_object {
  type: string
}
export function isCommitType(arg: any): arg is vuex_commit_object {
  return arg.type != undefined
}

function unifyObjectStyle(type: vuex_commit_type, payload: vuex_payload, options: any) {
  if (isCommitType(type)) {
    options = payload
    payload = type
    type = type.type
  }

  assert(typeof type === 'string', `Expects string as the type, but found ${typeof type}.`)

  return { type, payload, options }
}

export default class Store {
  private _vm: Vue
  public mutations: vuex_mutations
  public plugins: vuex_plugin[]
  public subscribers: vuex_subscriber[]
  private _committing = false
  private _devtoolHook: any
  public mapState: (states: vuex_state) => any
  public mapMutations: (map: any) => any
  public actions?: []
  public getters?: []

  constructor(init: {
    state: vuex_state | Function
    mutations?: vuex_mutations
    plugins?: vuex_plugin[]
    subscribers?: vuex_subscriber[]
  }) {
    // setup the vm
    this._vm = new Vue({
      data: {
        $$state: typeof init.state === 'function' ? init.state() : init.state
      }
    })

    const store = this
    const { commit } = this
    this.mutations = init.mutations || {}
    this.plugins = init.plugins || []
    this.subscribers = init.subscribers || []

    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options)
    }

    if (!gVue && typeof window !== 'undefined' && window.Vue) {
      install((window as any).Vue)
    }

    this.plugins.forEach(plugin => plugin(this))

    if (Vue.config.devtools) {
      this.getters = []
      this.actions = []
      devtoolPlugin(this)
    }

    this.mapState = createMapState(this)
    this.mapMutations = mapToMethods('mutations', 'commit', this)
  }

  public get state() {
    return this._vm.$data.$$state
  }

  public set state(v) {
    /**
     * @todo Add deep watch for state to prevent mutations outside handlers
     * @body [not safe for production](https://vuex.vuejs.org/en/strict.html)
     */
    assert(false, `Use store.replaceState() to explicitly replace state.`)
  }

  public subscribe(sub: vuex_subscriber) {
    this.subscribers.push(sub)
    return () => this.subscribers.splice(this.subscribers.indexOf(sub), 1)
  }

  public replaceState(state: vuex_state) {
    this._vm.$data.$$state = state
    return this
  }

  public commit(_type: vuex_commit_type, _payload: vuex_payload, _options?: any) {
    //this.call(st)
    const { type, payload, options } = unifyObjectStyle(_type, _payload, _options)
    const mutation = { type: type.toString(), payload }
    const handler = this.mutations[type.toString()]

    this._withCommit(() => {
      handler(this.state, payload)
    })

    this.subscribers.forEach(sub => sub(mutation, this.state))
  }

  private _withCommit(fn: () => void) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = committing
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
