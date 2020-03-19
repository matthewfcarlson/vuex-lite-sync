const SHOULD_THROW = process.env.NODE_ENV !== "production";

export function assert(condition:Boolean, msg:String) {
  if (!condition && SHOULD_THROW) throw new Error(`[vuex] ${msg}`);
}

export function isObject(obj:any) {
  return obj !== null && typeof obj === "object";
}