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

export default class SyncedStore<S> {
  public _devtoolHook: any
  public subscribers: MutationSubscriber<any, S>[] // TODO get rid of this any
  private committing = false
  public dispatch: Dispatch
  public commit: Commit
  private _vm: any
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

    this.dispatch = function boundDispatch(type: any, payload: DispatchOptions | undefined) {
      return dispatch.call(store, type, payload)
    }

    this.commit = function boundCommit(type: any, payload: any) {
      return commit.call(store, type, payload)
    }

    // apply plugins
    plugins.forEach(plugin => plugin(this))
  }

  public get state(): S {
    return this._vm._data.$$state
  }

  public get getters(): any {
    assert(false, `getters is not supported`)
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
    //this._vm.$data.$$state = state
    return this
  }

  public subscribe<P extends MutationPayload>(fn: MutationSubscriber<P, S>) {
    this.subscribers.push(fn)
    return () => this.subscribers.splice(this.subscribers.indexOf(fn), 1)
  }

  public subscribeAction<P extends ActionPayload>(_fn: SubscribeActionOptions<P, S>): () => void {
    assert(false, 'Subscribe Action is not supported')
    return () => assert(false, 'Subscribe Action is not supported')
  }

  public watch<T>(
    _getter: (state: S, getters: any) => T,
    _cb: (value: T, oldValue: T) => void,
    _options?: WatchOptions
  ): () => void {
    return () => assert(false, 'Watch is not supported')
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
    assert(false, 'Hot update is not supported')
  }

  private _withCommit(fn: () => void) {
    const committing = this.committing
    this.committing = true
    fn()
    this.committing = committing
  }

  public resetStore(store: SyncedStore<S>, hot: boolean = false) {
    store.actions = Object.create(null)
    store.mutations = Object.create(null)
    const state = store.state
    // reset vm
    store.resetStoreVM(store, state, hot)
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
          oldVm._data.$$state = null
        })
      }
      Vue.nextTick(() => oldVm.$destroy())
    }
  }
}

export function install(_Vue: any) {
  if (Vue && _Vue === Vue) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[vuex] already installed. Vue.use(Vuex) should be called only once.')
    }
    return
  }
  Vue = _Vue
  //applyMixin(Vue)
}
