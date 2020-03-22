import Vue from "Vue";
import Vuex from "../src";

const TEST = "TEST";

// install vuex
Vue.use(Vuex);

// supress production tips
Vue.config.productionTip = false;

describe("Mutations", () => {
  test("function style commit", () => {
    const store = new Vuex.Store({
      state: {
        a: 1
      },

      mutations: {
        [TEST](state, n) {
          state.a += n;
        }
      }
    });

    store.commit(TEST, 2);
    expect(store.state.a).toBe(3);
  });

  test("object style commit", () => {
    const store = new Vuex.Store({
      state: {
        a: 1
      },

      mutations: {
        [TEST](state, payload) {
          state.a += payload.amount;
        }
      }
    });

    store.commit({
      type: TEST,
      amount: 2
    });

    expect(store.state.a).toBe(3);
  });

  it("asserts committed type", () => {
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      mutations: {
        // Maybe registered with undefined type accidentally
        // if the user has typo in a constant type
        undefined(state, n) {
          state.a += n;
        }
      }
    });
    expect(store.state.a).toBe(1);
  });
});

describe("Reset", () => {
  it("should reset the store", () => {
    const store = new Vuex.Store({
      state: () => ({
        a: 1
      }),
      mutations: {
        [TEST](state, n) {
          state.a += n;
        }
      }
    });
    expect(store.state.a).toBe(1);
    store.resetStore(store);
    // make sure we didn't lose any data
    expect(store.state.a).toBe(1);
    // make sure we didn't lose mutators
    store.commit(TEST, 2);
    expect(store.state.a).toBe(3)
  });
  it("should reset the store hot", () => {
    const store = new Vuex.Store({
      state: () => ({
        a: 1
      }),
      mutations: {
        [TEST](state, n) {
          state.a += n;
        }
      }
    });
    expect(store.state.a).toBe(1);
    store.resetStore(store, true);
    // make sure we didn't lose any data
    expect(store.state.a).toBe(1);
    // make sure we didn't lose mutators
    store.commit(TEST, 2);
    expect(store.state.a).toBe(3)
  });
});


describe("State", () => {
  it("should accept a function as state", () => {
    const store = new Vuex.Store({
      state: () => ({
        a: 1
      }),
      mutations: {
        [TEST](state, n) {
          state.a += n;
        }
      }
    });
    expect(store.state.a).toBe(1);
    store.commit(TEST, 2);
    expect(store.state.a).toBe(3);
  });

  it("should not call root state function twice", () => {
    const setup = {
      initialState: () => ({ a: 1 })
    };

    const stateSpy = jest.spyOn(setup, "initialState");

    new Vuex.Store({
      state: setup.initialState
    });

    expect(stateSpy).toHaveBeenCalledTimes(1);
  });

  it("should not allow explicit state modification", () => {
    const store = new Vuex.Store({
      state: {
        a: 1
      }
    });
    expect(() => {
      store.state = { a: 10 };
    }).toThrowError(/to explicitly replace state/);
    expect(store.state.a).toBe(1);
  });

  test("replace state", () => {
    const initialState = { a: 1 };

    const store = new Vuex.Store({
      state: initialState
    });

    expect(store.state.a).toBe(1);
    store.replaceState({ a: 2 });
    expect(store.state.a).toBe(2);
  });
});

describe("Subscriptions", () => {
  test("subscriptions / unsubscriptions", () => {
    const subscribers = {
      one: () => { },
      two: () => { }
    };

    const subscribeSpy = jest.spyOn(subscribers, "one");
    const secondSubscribeSpy = jest.spyOn(subscribers, "two");

    const testPayload = 2;

    const store = new Vuex.Store({
      state: {},
      mutations: {
        [TEST]: () => { }
      }
    });

    const unsubscribe = store.subscribe(subscribers.one);
    store.subscribe(subscribers.two);

    store.commit(TEST, testPayload);
    unsubscribe();
    store.commit(TEST, testPayload);

    expect(subscribeSpy).toHaveBeenCalledWith(
      { type: TEST, payload: testPayload },
      store.state
    );
    expect(secondSubscribeSpy).toHaveBeenCalled();
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(secondSubscribeSpy).toHaveBeenCalledTimes(2);
  });

});

describe("Store", () => {

  test("injection", () => {
    const store = new Vuex.Store({ state: { a: 1 } });
    const vm = new Vue({
      store
    });
    const child = new Vue({ parent: vm });
    expect((child as any).$store).toBe(store);
  });

  test("plugins", () => {
    const myplugins = {
      logger: (_store: any) => {
        // called when the store is initialized
        _store.subscribe((mutation: any, state: any) => {
          // called after every mutation.
          // The mutation comes in the format of `{ type, payload }`.
          return true;
        });
      }
    };

    const pluginSpy = jest.spyOn(myplugins, "logger");

    const store = new Vuex.Store({
      state: {
        a: 1
      },

      plugins: [myplugins.logger],

      mutations: {
        [TEST](state, n) {
          state.a += n;
        }
      }
    });

    store.commit(TEST, 2);
    store.commit(TEST, 5);
    expect(pluginSpy).toHaveBeenCalledTimes(1);
  });

  test("install", () => {
    expect(() => {
      Vuex.install(Vue);
    }).toThrowError(/already installed/);
  });

  test("watch", () => {
    expect(() => {
      interface state {
        a: number
      }
      const store = new Vuex.Store<state>({
        state: { a: 1 },
        mutations: {
          [TEST]: state => state.a++
        }
      });
      store.watch(state => state.a, (_value, _old)=> {});
      store.commit(TEST);
    }).toThrowError(/Watch is not supported/);
  });

  test("registerModule", () => {
    expect(() => {
      interface state {
        a: number
      }
      const store = new Vuex.Store<state>({
        state: { a: 1 },
        mutations: {
          [TEST]: state => state.a++
        }
      });
      store.registerModule("test", {});
    }).toThrowError(/registerModule is not supported/);
  });
  test("unregisterModule", () => {
    expect(() => {
      interface state {
        a: number
      }
      const store = new Vuex.Store<state>({
        state: { a: 1 },
        mutations: {
          [TEST]: state => state.a++
        }
      });
      store.unregisterModule("test");
    }).toThrowError(/unregisterModule is not supported/);
  });
  test("hotUpdate", () => {
    expect(() => {
      interface state {
        a: number
      }
      const store = new Vuex.Store<state>({
        state: { a: 1 },
        mutations: {
          [TEST]: state => state.a++
        }
      });
      store.hotUpdate({});
    }).toThrowError(/hotUpdate is not supported/);
  });
  test("hotUpdate", () => {
    expect(() => {
      interface state {
        a: number
      }
      const store = new Vuex.Store<state>({
        state: { a: 1 },
        mutations: {
          [TEST]: state => state.a++
        }
      });
      console.error(store.getters);
    }).toThrowError(/getters are not supported/);
  });
});