import Vue from "Vue";
import Vuex from "../src";
import { ITransporter } from "../src/transporter";
import { InMemoryTransporter } from "../src/transporter/in_memory";

const TEST = "TEST";

// install vuex
Vue.use(Vuex);

// supress production tips
Vue.config.productionTip = false;

async function wait(delay: number) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

describe("Basic Sync", () => {

    test("has function style commit", async () => {
        InMemoryTransporter.init();
        function createStore(_room: string) {
            const transport = new InMemoryTransporter(); //TODO handle
            const store = new Vuex.Store({
                state: () => ({
                    a: 1
                }),
                mutations: {
                    [TEST](state, payload) {
                        state.a += payload;
                    }
                }
            });
            store.addTransport(transport);
            return store;
        }

        const store1 = createStore("lobby");
        const store2 = createStore("lobby");

        expect(store1.state.a).toBe(1);
        expect(store2.state.a).toBe(1);
        store2.commit(TEST, 2);
        expect(store2.state.a).toBe(3);
        expect(store1.state.a).toBe(3);
        store1.commit(TEST, 2);
        expect(store1.state.a).toBe(5);
        expect(store2.state.a).toBe(5);

        store1.closeTransports();
        store2.closeTransports();

    });
    test("works with delay", async () => {
        InMemoryTransporter.init();
        function createStore(_room: string) {
            const transport = new InMemoryTransporter({ delay: 50 }); //TODO handle
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

        const store1 = createStore("lobby");
        const store2 = createStore("lobby");

        expect(store1.state.a).toBe(1);
        expect(store2.state.a).toBe(1);
        store2.commit(TEST, 2);
        expect(store2.state.a).toBe(3);
        expect(store1.state.a).toBe(1);
        // wait 50 * 2 ms - since it's not precise
        await wait(150);
        expect(store1.state.a).toBe(3);

        store1.closeTransports();
        store2.closeTransports();

    });

    test("incompatible with invalid definitions", async () => {
        InMemoryTransporter.init();
        function createStore(name: string, _room: string) {
            const transport = new InMemoryTransporter(); //TODO handle
            const store = new Vuex.Store({
                state:{a : 1},
                mutations: {
                    [name](state, payload) {
                        state.a += payload;
                    }
                }
            });
            store.addTransport(transport);
            return store;
        }

        const store1 = createStore("a", "lobby");
        const store2 = createStore("b", "lobby");

        expect(store1.state.a).toBe(1);
        expect(store2.state.a).toBe(1);
        
        expect( () => {
            store2.commit("a", 2);
        }).toThrowError(/Unknown mutation/);
        
        store1.closeTransports();
        store2.closeTransports();

    });
});

describe("Client Server", () => {


});