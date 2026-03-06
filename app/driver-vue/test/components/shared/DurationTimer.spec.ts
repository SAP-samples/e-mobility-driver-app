// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import DurationTimer from '@/components/shared/DurationTimer.vue';

describe('DurationTimer', () => {
  it('renders without crashing', () => {
    const { container } = render(DurationTimer, {
      props: {
        start: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      },
    });
    expect(container).toBeTruthy();
  });

  it('renders correct initial formatted time', async () => {
    const { getByText } = render(DurationTimer, {
      props: {
        start: new Date(Date.now() - 3661 * 1000), // 1 hour, 1 minute, 1 second ago
      },
    });
    await nextTick();
    // Should be close to 01:01:01
    expect(getByText((text) => text.startsWith('01:01:'))).toBeTruthy();
  });
});
