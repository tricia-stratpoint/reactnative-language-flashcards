/**
 * @file init.js
 * Detox setup for Jest environment
 */

/* eslint-env node */
/* global jest, jasmine, beforeAll, afterAll, beforeEach */

import detox from "detox";
import adapter from "detox/runners/jest/adapter";

// Set Jest timeout for Detox
jest.setTimeout(120000);

// Register Detox adapter with Jest
jasmine.getEnv().addReporter(adapter);

// Initialize Detox before all tests
beforeAll(async () => {
  await detox.init();
});

// Cleanup Detox after all tests
afterAll(async () => {
  await detox.cleanup();
});

// Reset adapter state before each test
beforeEach(async () => {
  await adapter.beforeEach();
});
