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

export interface SyncCommitOptions extends CommitOptions {
  external?: boolean // is this something that was triggered externally
}

let Vue: any

// connects to vuex devtools
import devtoolPlugin from './plugins/devtool'
import { ITransporter, ITransportPacket } from './transporter'
import { boundMethod } from 'autobind-decorator'

export type MutationSubscriber<P extends MutationPayload, S> = (mutation: P, state: S) => any
export type InitialState<S> = S | (() => S) | undefined

export class SyncedStore<S> {
  public _devtoolHook: any
  public subscribers: MutationSubscriber<any, S>[] // TODO get rid of this any
  private committing = false
  private _vm!: RealVue
  private strict: boolean
  private clientId: string
  private mutations: MutationTree<S>
  private transports: ITransporter[]
  private actions: ActionTree<S, any>
  private commitLog: any[]

  constructor(options: StoreOptions<S>) {
    const store = this

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

    this.commitLog = []

    const state = options.state
    this.resetStoreVM(this, state)

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

    this.transports = []

    // Generate a random client ID just for kicks
    this.clientId = (Math.floor(Math.random() * 5000) + 1).toString() //right now just between 1 and 1000
  }

  public get ClientId() {
    return this.clientId
  }

  public addTransport(transporter: ITransporter) {
    transporter.setReceive(this.receiveTransport, this.clientId)
    this.transports.push(transporter)
  }

  public setClientId(id: string) {
    this.clientId = id
  }

  //(payloadWithType: P, options?: DispatchOptions) or type: string, payload?: any, options?: DispatchOptions
  public dispatch<P extends Payload>(
    _payloadOrType: P | string,
    _payloadOrOptions?: any | DispatchOptions,
    _options?: DispatchOptions
  ): Promise<any> {
    assert(false, "We don't do dispatch")
    return new Promise<any>(resolve => {
      assert(false, "We don't do dispatch")
    })
  }

  @boundMethod
  private receiveTransport(packet: ITransportPacket) {
    // Verify that the packet is good? Possibly reject the packet?
    // how to prevent us from sending this packet out again
    const result = this.commit(packet.action, packet.payload, { external: true })
    if (!result) {
      // let the transport know it was a bad packet
      console.error('Bad packet')
    }
  }

  public hasTransports() {
    return this.transports.length > 0
  }

  public closeTransports() {
    this.transports.forEach(x => x.close())
    this.transports = []
  }

  @boundMethod
  public commit<P extends Payload>(
    mutation: P | string,
    data?: SyncCommitOptions | any,
    _options?: SyncCommitOptions
  ): boolean {
    const { type, payload, options } = unifyObjectStyle(mutation, data, _options)

    const handler = this.mutations[type]
    if (!handler) {
      assert(handler, '[vuex] Unknown mutation type ' + type)
      return false
    }

    const handle = { type, payload }

    const result = this._withCommit(() => {
      return handler(this.state, payload)
    })
    if (result === false) return false // the commit failed to apply if we return false
    this.commitLog.push(handle)

    // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
    this.subscribers.slice().forEach(sub => sub(handle, this.state))

    if (this.hasTransports() && (!options || (options && !options.external))) {
      // Update all the transport
      const packet = {
        action: type,
        payload: payload,
        sourceId: this.clientId,
        msSinceLastPacket: 0,
        packetId: 0,
        previousPacketId: 0
      }
      this.transports.forEach(x => x.send(packet))
    }

    return true
  }

  @boundMethod
  public dumpLog() {
    console.log(this.clientId, ' commit log: ', this.commitLog)
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

  @boundMethod
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

  @boundMethod
  private _withCommit(fn: () => boolean) {
    const committing = this.committing
    this.committing = true
    const result = fn()
    this.committing = committing
    return result
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

  @boundMethod
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
          return true
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

function unifyObjectStyle(
  type: string | Payload,
  payload?: any | SyncCommitOptions,
  options?: SyncCommitOptions
): { type: string; payload?: any; options?: SyncCommitOptions } {
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
