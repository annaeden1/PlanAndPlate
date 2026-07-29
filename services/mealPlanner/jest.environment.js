delete globalThis.localStorage;
delete globalThis.sessionStorage;

module.exports = require('jest-environment-node').default;
