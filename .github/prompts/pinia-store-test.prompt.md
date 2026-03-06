---
mode: 'agent'
model: GPT-4.1
tools: ['githubRepo', 'codebase', 'fetch']
description: 'Generate a new Vuejs3 Pinia store test'
---

Generate a unit test file for the Pinia store in the Vue 3 application located in app/driver-vue, targeted store at '${input:storeFilePath}'.

Requirements:
* Use Vitest as the test runner.
* Use Pinia's testing utilities and best practices for Vue 3.
* Use TypeScript for the test file.
* Mock all external dependencies, API calls, and injected services as needed.
* Test all state, getters, and actions, including edge cases and error handling.
* Test reactivity of state and computed values.
* Test store actions for correct state mutation and side effects.
* Place the new test in a 'test' folder following the same sub-path of the store file.
* Name the test file '${input:storeFileName}.spec.ts', where 'storeFileName' is the base name of the store file (without extension).
* Name of the test file must not contain 'dumb'.
* Each store should have its own dedicated test file (1:1 mapping between store and test file).
* Ensure all conditional branches and corner cases in the store logic are covered by tests (e.g., all possible values for state, all branches in actions).
* Use semantic assertions and avoid implementation details.
* If the store interacts with other stores or services, mock them and verify interactions.

Example test structure:
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '@/${input:storeFilePath}';

describe('Store: ${input:storeFilePath}', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with default state', () => {
    const store = useStore();
    // ...test implementation...
    // expect(store.someState).toBe(...);
  });

  it('getter returns expected value', () => {
    const store = useStore();
    // ...test implementation...
    // expect(store.someGetter).toBe(...);
  });

  it('action updates state correctly', async () => {
    const store = useStore();
    // ...test implementation...
    // await store.someAction();
    // expect(store.someState).toBe(...);
  });

  // ...more tests for edge cases, errors, and interactions...
});

Please generate the test file following these instructions.
