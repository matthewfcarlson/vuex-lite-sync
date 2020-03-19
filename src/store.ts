import { assert, isObject } from "./utils";
import { createMapState, mapToMethods } from "./helpers";

// connects to vuex devtools
import devtoolPlugin from "./plugins/devtool";

let Vue; // bind on install => Vue.use(Vuex)

function unifyObjectStyle(type, payload, options) {
  if (isObject(type) && type.type) {
    options = payload;
    payload = type;
    type = type.type;
  }

  assert(
    typeof type === "string",
    `Expects string as the type, but found ${typeof type}.`
  );

  return { type, payload, options };
}

export default class Store {
  public position: number;
  protected speed: number;

  constructor(position: number, speed: number) {
      this.position = position;
      this.speed = speed;
  }
}

export function install(_Vue) {
  if (Vue && _Vue === Vue) {
    assert(
      false,
      `already installed. Vue.use(Vuex) should be called only once.`
    );
    /* istanbul ignore next: unreachable code in test or development */
    return;
  }

  Vue = _Vue;

  Vue.mixin({
    beforeCreate: vuexInit
  });

  function vuexInit() {
    const options = this.$options;

    if (options.store) {
      // store injection
      this.$store =
        typeof options.store === "function" ? options.store() : options.store;
    } else if (options.parent && options.parent.$store) {
      // store injection for children
      this.$store = options.parent.$store;
    }
  }
}