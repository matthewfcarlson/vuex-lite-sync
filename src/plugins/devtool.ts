import Store from '../store'

const devtoolHook = typeof window !== 'undefined' && (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__

export default function devtoolPlugin(store: Store<any>) {
  if (!devtoolHook) return

  store._devtoolHook = devtoolHook

  devtoolHook.emit('vuex:init', store)

  devtoolHook.on('vuex:travel-to-state', (targetState: any) => {
    store.replaceState(targetState)
  })

  store.subscribe((mutation: any, state: any) => {
    devtoolHook.emit('vuex:mutation', mutation, state)
  })
}
