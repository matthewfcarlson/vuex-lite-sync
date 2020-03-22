import Vue from "Vue";
import Vuex from "../src";
import { ITransporter } from "../src/transporter";
import { InMemoryTransporter } from "../src/transporter/in_memory";

const TEST = "TEST";

// install vuex
Vue.use(Vuex);

// supress production tips
Vue.config.productionTip = false;

describe("Basic Sync", () => {

    test("function style commit", () => {
        function createStore(transport:ITransporter) {
            const store = new Vuex.Store({
                state: {
                    a: 1
                },
                mutations: {
                    [TEST](state, payload) {
                        state.a += payload;
                    }
                }
            });
            store.addTransport(transport);
            return store;
        }

        const transport = new InMemoryTransporter();
        const store1 = createStore(transport);
        const store2 = createStore(transport);

        expect(store1.state.a).toBe(1);
        expect(store2.state.a).toBe(1);
        store1.commit(TEST, 2);
        expect(store1.state.a).toBe(3);
        expect(store2.state.a).toBe(3);

    });
});