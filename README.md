# vuex-lite-sync
a vuex inspired/compatible store that is synced over websockets

[![npm version](https://badge.fury.io/js/vuex-lite-sync.svg)](https://badge.fury.io/js/vuex-lite-sync)
[![codecov](https://codecov.io/gh/matthewfcarlson/vuex-lite-sync/branch/master/graph/badge.svg)](https://codecov.io/gh/matthewfcarlson/vuex-lite-sync)
[![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://ko-fi.com/padgames)

Heavily inspired by Rayraegah's Vuex-lite https://github.com/Rayraegah/vuex-lite

## Features

- Small size, the goal is to have a 2kb state synced management library
- Similar to Vuex (with a slightly reduced feature set)
- `vue-devtools` will work out of the box
- Written in typescript so types are provided

## How it works

Each store has getter and setters, all changes to state are through mutations.
Each mutation is stored on the log and from where the mutation came from.
In addition, each mutation has the last mutation as it's parent with some logic to determine what the proper state is.

Each store has a reference to some sort of message transport layer, a websocket implementation is currently the only planned implementation but there could be other instances.

The idea is that you have a store on your server which stores the state as well as your client(s), and mutations are automatically mirrored across all the clients connected.

In addition, there will be a web-socket

This makes it hard to spoof state, as the mutations are verified as allowable.

## Using it in your project

You are welcome to see the project this was developed for: padgames at https://github.com/matthewfcarlson/padgames/

I've provided some documentation as well as well as a simple sample application.

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

```js
// store.js
import Vue from 'vue'
import VuexLiteSynced from 'VuexLiteSynced'

Vue.use(VuexLiteSynced)

const store = new VuexLiteSynced({
  state: {},
  mutations: {},
  views:{},
  actions: {},
  plugins: []
})
```

#### Bind store instance

In order to access `store` in every component:

```js
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
- store.commit(type, payload)
- store.dispatch(type, payload)
- store.subscribe(subscriber)
- store.replaceState(newState)
- store.mapState(map)
- store.mapViews(map)
- store.mapActions(map)
- store.mapMutations(map)

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

Released under MPL-2.0
