import Vue from "vue";
import Vuex from "../src";
import { mapState, mapMutations } from '../src'

// install vuex
Vue.use(Vuex as any);

// supress production tips
Vue.config.productionTip = false;

describe("Helpers", () => {
  test("mapState (array)", () => {
    interface state  {
      a: number
    }
    const store = new Vuex.Store<state>({
      state: {
        a: 1
      },

      mutations: {
        inc(state, val) {
          state.a += val;
        }
      }
    });

    const vm = new Vue({
      store,
      computed: mapState(["a"])
    });

    expect((vm as any).a).toBe(1);
    store.commit("inc", 1);
    expect((vm as any).a).toBe(2);
  });

  test("mapState (object)", () => {
    interface state  {
      a: number,
      b: number
    }
    const store = new Vuex.Store<state>({
      state: {
        a: 1,
        b: 1
      },

      mutations: {
        inc(state, val) {
          state.a += val;
        }
      }
    });

    const vm = new Vue({
      store,
      computed: mapState({
        a: (state:state) => {
          return state.a + state.b;
        }
      })
    });

    expect((vm as any).a).toBe(2);
    store.commit("inc", 1);
    expect((vm as any).a).toBe(3);
  });

  test("mapMutations (object)", () => {
    interface state  {
      count: number
    }
    const store = new Vuex.Store<state>({
      state: { count: 0 },
      mutations: {
        inc: state => state.count++,
        dec: state => state.count--
      }
    });
    const vm = new Vue({
      store,
      methods: mapMutations({
        plus: "inc",
        minus: "dec"
      })
    });
    (vm as any).plus();
    expect(store.state.count).toBe(1);
    (vm as any).minus();
    expect(store.state.count).toBe(0);
  });
});