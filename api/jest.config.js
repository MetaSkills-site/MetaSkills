/**
 * @file jest.config.js
 * @description Jest testing framework configuration.
 * @architecture Used for executing backend unit and integration tests.
 */
/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  clearMocks: true,
  transform: {},
};
