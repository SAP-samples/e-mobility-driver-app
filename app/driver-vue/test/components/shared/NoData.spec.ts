// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import NoData from '@/components/shared/NoData.vue';

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('NoData', () => {
  it('renders without crashing', () => {
    const { container } = render(NoData, renderOptions);
    expect(container).toBeTruthy();
  });

  it('renders default title, subtitle, and actionText', () => {
    const { container, getByText } = render(NoData, renderOptions);
    const illustratedMsg = container.querySelector('ui5-illustrated-message');
    expect(illustratedMsg?.getAttribute('title-text')).toBe('Fuse Not Blown — Just No Data!');
    expect(illustratedMsg?.getAttribute('subtitle-text')).toBe(
      "Everything's connected, but there's nothing to display right now. Check back soon for more electric action!",
    );
    expect(getByText('Go Back Home')).toBeTruthy();
  });

  it('renders custom title, subtitle, and actionText', () => {
    const { container, getByText } = render(NoData, {
      ...renderOptions,
      props: {
        title: 'Custom Title',
        subtitle: 'Custom Subtitle',
        actionText: 'Custom Action',
      },
    });
    const illustratedMsg = container.querySelector('ui5-illustrated-message');
    expect(illustratedMsg?.getAttribute('title-text')).toBe('Custom Title');
    expect(illustratedMsg?.getAttribute('subtitle-text')).toBe('Custom Subtitle');
    expect(getByText('Custom Action')).toBeTruthy();
  });

  it('emits action event when button is clicked', async () => {
    const { getByText, emitted } = render(NoData, renderOptions);
    const button = getByText('Go Back Home');
    await fireEvent.click(button);
    expect(emitted().action).toBeTruthy();
  });
});
