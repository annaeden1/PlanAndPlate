'use strict';
/**
 * Forces every require('mongoose') call — including those inside service
 * sub-packages — to resolve to the single root-level mongoose instance.
 *
 * Load this before the seed script:
 *   ts-node --require ./scripts/patchMongoose.js scripts/seedMockData.ts
 */
const Module = require('module');
const rootMongoosePath = require.resolve('mongoose'); // resolves from root node_modules
const orig = Module._resolveFilename.bind(Module);

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'mongoose') return rootMongoosePath;
  return orig(request, parent, isMain, options);
};
