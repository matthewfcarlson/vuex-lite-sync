# vuex-lite-sync
a vuex inspired/compatible store that is synced over websockets

[![npm version](https://badge.fury.io/js/vuex-lite-sync.svg)](https://badge.fury.io/js/vuex-lite-sync)
[![codecov](https://codecov.io/gh/matthewfcarlson/vuex-lite-sync/branch/master/graph/badge.svg)](https://codecov.io/gh/matthewfcarlson/vuex-lite-sync)
[![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://ko-fi.com/padgames)
[![issues](https://img.shields.io/github/issues/matthewfcarlson/vuex-lite-sync)](https://github.com/matthewfcarlson/vuex-lite-sync/issues)
[![license](https://img.shields.io/github/license/matthewfcarlson/vuex-lite-sync)](https://github.com/matthewfcarlson/vuex-lite-sync/blob/master/LICENSE)

Heavily inspired by Rayraegah's Vuex-lite https://github.com/Rayraegah/vuex-lite and vuex itself https://github.com/vuejs/vuex

Documentation at: https://matthewc.dev/vuex-lite-sync/

## Features

- Small size, the goal is to have a 10kb state synced management library
- Similar to Vuex (with a slightly reduced feature set)
- `vue-devtools` will work out of the box
- Written in typescript so types are provided
- Mutations are synced over the transport layer with logic to handle competing connections

## How it works

Each store has getter and setters, all changes to state are through mutations.
Each mutation is stored in a store specific log and from where the mutation came from.
In addition, each mutation has the last mutation as it's parent with some logic to determine what the proper state is.

Each store has a reference to some sort of message transport layer, a websocket implementation is currently the only planned implementation but there could be other instances.

The idea is that you have a store on your server which stores the state as well as your client(s), and mutations are automatically mirrored across all the clients connected.

This makes it hard to spoof state, as the mutations are verified as allowable with a parent. This makes it so a bad actor has a hard time of polluting global state. 
However, this brings an interesting challenge of making sure all stores are up to date.
Each store has a verion associated with it, which should be incremented when a breaking/significant change is introduced.

Stores also need to have a way to ask for state they might have missed. 
They'll send out a message to get a replay of the mutations.
If this still doesn't work, stores have an exception handler that can be invoked to decide what to do.
In the case of a web app, this could be refreshing the page.

Strict mode is always on! Any mutations outside of mutation handlers will throw an Error. 
It's an unpopular stance, but I think it's a good one. If you feel strongly, open an issue and make your case.

## Using it in your project

You are welcome to see the project this was developed for: padgames at https://github.com/matthewfcarlson/padgames/

I've provided some documentation as well as well as a simple sample application.
See the `examples` folder.

### Install

Install as an npm package

```
npm install --save vuex-lite-sync
```

or via CDN

```
https://unpkg.com/vuex-lite-sync
```

Then, `import` or `require` use just like `vuex`.

### Usage

#### Create store instance

```ts
// store.ts
import Vue from 'vue'
import VuexLiteSynced from 'VuexLiteSynced'

Vue.use(VuexLiteSynced)

const store = new VuexLiteSynced({
  state: {}, // you can't 
  mutations: {}, // this is the mutation
  getters:{}, // this is the getters that present that state in nicer ways
  actions: {}, // this is the higher level actions that transform into mutations
  plugins: [], // this is the plugin
  transport: null, // this is the message layer transport
  panic_handler: null, // this is invoked when we can't recreate the state
})
```

#### Bind store instance

In order to access `store` in every component:

```ts
import Vue from 'vue'
import store from './store'

// In your root Vue instance:
new Vue({
  store,
  render: h => h(YourApp)
})
// this.$store will be available in component
```

### store

- store.state `readonly`
- store.mutations
- store.actions
- store.setTransport(transport)
- store.commit(type, payload)
- store.subscribe(subscriber)
- store.replaceState(newState)
- store.mapState(map)
- store.mapMutations(map)

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

Released under MPL-2.0
