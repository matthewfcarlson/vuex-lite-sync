import RealVue, { WatchOptions } from 'vue'
import {
  StoreOptions,
  Plugin,
  ActionSubscriber,
  Mutation,
  MutationTree,
  MutationPayload,
  Commit,
  Dispatch,
  ActionTree,
  GetterTree,
  ModuleTree,
  ActionPayload,
  SubscribeActionOptions,
  Module,
  ModuleOptions,
  Payload,
  DispatchOptions,
  CommitOptions
} from 'vuex'
import { forEachValue, isObject, isPromise, assert, partial } from './utils'

let Vue: any

// connects to vuex devtools
import devtoolPlugin from './plugins/devtool'

export type MutationSubscriber<P extends MutationPayload, S> = (mutation: P, state: S) => any
export type InitialState<S> = S | (() => S) | undefined

export class SyncedStore<S> {
  public _devtoolHook: any
  public subscribers: MutationSubscriber<any, S>[] // TODO get rid of this any
  private committing = false
  public dispatch: Dispatch
  //public commit: Commit
  private _vm!: RealVue
  private strict: boolean
  private mutations: MutationTree<S>
  private actions: ActionTree<S, any>
  /*
   private _vm: Vue;
  public mutations: MutationTree;
  readonly getters: any;
  public plugins: Plugin<S>[];
  public subscribers: ActionSubscriber<S>[];
  private committing = false;
  public commit: Commit;
  public dispatch: Dispatch;
  public _devtoolHook: any;
  public mapState: (states: S) => any;
  public mapMutations: (map: any) => any;
  */

  constructor(options: StoreOptions<S>) {
    const store = this
    const { dispatch, commit } = this

    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here. See #731
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue)
    }

    if (process.env.NODE_ENV !== 'production') {
      assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`)
      assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
      assert(this instanceof SyncedStore, `store must be called with the new operator.`)
    }

    const { plugins = [], strict = false } = options

    // strict mode is always on
    this.strict = true

    // Setup internal state
    this.mutations = {}
    this.subscribers = []
    this.actions = {}

    const state = options.state
    this.resetStoreVM(this, state)

    this.dispatch = function boundDispatch(type: any, payload?: DispatchOptions) {
      return dispatch.call(store, type, payload)
    }

    /*this.commit = function boundCommit(type: any, payload?: CommitOptions) {
      return commit.call(store, type, payload)
    }*/

    // Add the mutators
    if (options.mutations) {
      this.installMutators(options.mutations)
    }

    // apply plugins
    plugins.forEach(plugin => plugin(this))

    // Check for dev tools
    const useDevtools =
      (options as any).devtools !== undefined ? (options as any).devtools : Vue.config.devtools
    if (useDevtools) {
      devtoolPlugin(this)
    }
  }

  public commit<P extends Payload>(
    mutation: P | string,
    second?: CommitOptions | any,
    options?: CommitOptions
  ) {
    const { type, payload } = unifyObjectStyle(mutation, second, options)

    const handler = this.mutations[type]
    if (!handler) assert(handler, '[vuex] Unknown mutation type ' + type)

    this._withCommit(() => {
      handler(this.state, payload)
    })

    const handle = { type, payload }

    // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
    this.subscribers.slice().forEach(sub => sub(handle, this.state))
  }

  public get state(): S {
    if (!this._vm) assert(false, '_VM got corrupted somehow?')
    return this._vm.$data.$$state
  }

  public get getters(): any {
    assert(false, `getters are not supported`)
    return null
  }

  public set state(state: S) {
    /**
     * @todo Add deep watch for state to prevent mutations outside handlers
     * @body [not safe for production](https://vuex.vuejs.org/en/strict.html)
     */
    assert(false, `Use store.replaceState() to explicitly replace state.`)
  }

  public replaceState(state: S) {
    this._vm.$data.$$state = state
  }

  public subscribe<P extends MutationPayload>(fn: MutationSubscriber<P, S>) {
    this.subscribers.push(fn)
    return () => this.subscribers.splice(this.subscribers.indexOf(fn), 1)
  }

  public subscribeAction<P extends ActionPayload>(_fn: SubscribeActionOptions<P, S>): () => void {
    assert(false, 'Subscribe Action is not supported')
    return () => assert(false, 'Subscribe Action Callback is not supported')
  }

  public watch<T>(
    _getter: (state: S, getters: any) => T,
    _cb: (value: T, oldValue: T) => void,
    _options?: WatchOptions
  ): () => void {
    assert(false, 'Watch is not supported')
    return () => assert(false, 'Watch callback is not supported')
  }

  public registerModule<T>(
    _path: string | string[],
    _module: Module<T, S>,
    _options?: ModuleOptions
  ) {
    assert(false, 'registerModule is not supported')
  }

  public unregisterModule(_path: string | string[]) {
    assert(false, 'unregisterModule is not supported')
  }

  public hotUpdate(_options: {
    actions?: ActionTree<S, S>
    mutations?: MutationTree<S>
    getters?: GetterTree<S, S>
    modules?: ModuleTree<S>
  }): void {
    assert(false, 'hotUpdate is not supported')
  }

  private _withCommit(fn: () => void) {
    const committing = this.committing
    this.committing = true
    fn()
    this.committing = committing
  }

  /**
   * This doesn't reset the store to zero but recreates it with the same data
   * @param store
   * @param hot
   */
  public resetStore(store?: SyncedStore<S>, hot: boolean = false) {
    if (!store) store = this
    //store.actions = Object.create(null)
    //store.mutations = Object.create(null)
    const state = store.state
    // reset vm
    store.resetStoreVM(store, state, hot)
  }

  private installMutators(mutations: MutationTree<S>) {
    forEachValue(mutations, (val, key) => (this.mutations[key] = val))
  }

  private resetStoreVM(store: SyncedStore<S>, state: InitialState<S>, hot: boolean = false) {
    const oldVm = store._vm
    /*
    // bind store public getters
    store.getters = {}
    // reset local getters cache
    store._makeLocalGettersCache = Object.create(null)
    //const wrappedGetters = store._wrappedGetters
    */
    const computed = {}
    /*
    forEachValue(wrappedGetters, (fn, key) => {
      // use computed to leverage its lazy-caching mechanism
      // direct inline function use will lead to closure preserving oldVm.
      // using partial to return function with only arguments preserved in closure environment.
      computed[key] = partial(fn, store)
      Object.defineProperty(store.getters, key, {
        get: () => store._vm[key],
        enumerable: true // for local getters
      })
    })
    */
    // TODO: make sure we can still mutate

    if (state) {
      state = typeof state === 'function' ? (state as any)() : state
    }

    // use a Vue instance to store the state tree
    // suppress warnings just in case the user has added
    // some funky global mixins
    const silent = Vue.config.silent
    Vue.config.silent = true
    store._vm = new Vue({
      data: {
        $$state: state
      },
      computed
    })
    Vue.config.silent = silent

    if (oldVm) {
      if (hot) {
        // dispatch changes in all subscribed watchers
        // to force getter re-evaluation for hot reloading.
        store._withCommit(() => {
          oldVm.$data.$$state = null
        })
      }
      Vue.nextTick(() => oldVm.$destroy())
    }
  }
}

export function install(new_vue: any) {
  if (Vue && new_vue === Vue) {
    console.error('[vuex] already installed. Vue.use(Vuex) should be called only once.')
    if (process.env.NODE_ENV !== 'production') {
      assert(false, `already installed. Vue.use(Vuex) should be called only once.`)
      // TODO: don't bother with this?
    }
    return
  }
  Vue = new_vue
  Vue.mixin({
    beforeCreate: vuexInit
  })
}

function vuexInit(this: RealVue) {
  const options = this.$options

  if (options.store) {
    // store injection
    this.$store = typeof options.store === 'function' ? (options as any).store() : options.store
  } else if (options.parent && options.parent.$store) {
    // store injection for children
    this.$store = options.parent.$store
  }
}

function unifyObjectStyle(type: string | Payload, payload?: any, options?: any) {
  if (typeof type !== 'string' && type.type) {
    options = payload
    payload = type
    type = type.type
  }

  if (process.env.NODE_ENV !== 'production') {
    assert(typeof type === 'string', `expects string as the type, but found ${typeof type}.`)
  }

  return { type: type as string, payload, options }
}
