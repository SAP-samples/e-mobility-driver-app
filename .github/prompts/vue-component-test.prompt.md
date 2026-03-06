---
mode: 'agent'
model: GPT-4.1
tools: ['githubRepo', 'codebase', 'fetch']
description: 'Generate a new Vuejs3 tests for component'
---

Generate a unit test file for the Vue 3 application located in app/driver-vue, targeted component '${input:componentName}' located at '${input:componentPath}'.

Requirements:
* Use Vitest as the test runner.
* Use @testing-library/vue for rendering and assertions.
* Mock all props and events as needed.
* Test rendering of all props and slots.
* Test emitted events if any.
* Use TypeScript for the test file.
* Place the new test in a 'test' folder following the same sub-path of the component.
* Name the test file '${input:componentName}.spec.ts'.
* Name the test file must not contain dumb.
* Prefer semantic queries (by role, label, or text) for selecting elements in tests.
* Use data-testid only when semantic queries are not possible or practical (e.g., for custom elements or when text is not directly rendered).
* If a prop is rendered as an attribute (e.g., title-text), query the element and check the attribute value instead of using getByText.
* It is acceptable to leave data-testid attributes in production code, but use them judiciously to avoid clutter.
* Each component should have its own dedicated test file (1:1 mapping between component and test file).
* Ensure all conditional branches and corner cases in the component logic are covered by tests (e.g., all possible values for conditional rendering, such as design attributes or slot content).
* If a custom element or web component renders attributes asynchronously, use querySelectorAll and check all matching elements for the expected attribute value, rather than assuming a single match.

Example test structure:
import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import ${input:componentName} from '@/${input:componentName}.vue';

describe('${input:componentName}', () => {
  it('renders correctly', () => {
    // ...test implementation...
    // For attributes:
    // const header = container.querySelector('ui5-card-header');
    // expect(header?.getAttribute('title-text')).toBe('...');
    // Prefer getByRole, getByLabelText, getByText, etc. Use getByTestId only if needed.
    // For conditional rendering:
    // const tags = container.querySelectorAll('ui5-tag');
    // expect(Array.from(tags).some((tag) => tag.getAttribute('design') === 'Positive')).toBe(true);
    // expect(Array.from(tags).some((tag) => tag.getAttribute('design') === 'Negative')).toBe(true);
  });
});

Please generate the test file following these instructions.
