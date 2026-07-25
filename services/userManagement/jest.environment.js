// Node 22+ exposes `localStorage`/`sessionStorage` as globals that throw a
// SecurityError when read without `--localstorage-file`. Jest's node environment
// copies host globals into the test context, which trips that error. These APIs
// are not used by the service, so drop them before the environment is built.
delete globalThis.localStorage;
delete globalThis.sessionStorage;

module.exports = require('jest-environment-node').default;
