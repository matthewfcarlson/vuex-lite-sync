import { SyncedStore, install } from './store'
import { mapState, mapMutations } from './helpers'

// emulate vuex esm
export default {
  Store: SyncedStore,
  install,
  version: '__VERSION__',
  mapState,
  mapMutations,
  mapGetters: null,
  mapActions: null,
  createNamespacedHelpers: null
}
export { SyncedStore as Store, install, mapState, mapMutations }
