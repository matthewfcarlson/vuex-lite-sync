import SyncedStore, { install } from './store'

// emulate vuex esm
export default {
  Store: SyncedStore,
  install,
  version: '__VERSION__',
  mapState: null,
  mapMutations: null,
  mapGetters: null,
  mapActions: null,
  createNamespacedHelpers: null
}
