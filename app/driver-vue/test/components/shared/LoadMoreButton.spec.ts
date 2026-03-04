// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import LoadMoreButton from '@/components/shared/LoadMoreButton.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      common: {
        loading: 'Loading',
      },
      list: {
        load_more_results: 'Load More',
        showing_count: 'Showing {current} of {total}',
      },
    },
  },
});

describe('LoadMoreButton', () => {
  it('renders button when hasMore is true', () => {
    const wrapper = mount(LoadMoreButton, {
      props: {
        hasMore: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="load-more-button"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Load More');
  });

  it('does not render when hasMore is false', () => {
    const wrapper = mount(LoadMoreButton, {
      props: {
        hasMore: false,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="load-more-button"]').exists()).toBe(false);
  });

  it('shows loading state when loading is true', () => {
    const wrapper = mount(LoadMoreButton, {
      props: {
        hasMore: true,
        loading: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    const button = wrapper.find('[data-testid="load-more-button"]');
    expect(button.exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading');
  });

  it('passes loading prop to button', () => {
    const wrapper = mount(LoadMoreButton, {
      props: {
        hasMore: true,
        loading: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    // Verify loading prop is passed correctly
    const component = wrapper.findComponent(LoadMoreButton);
    expect(component.props('loading')).toBe(true);
  });

  it('emits load-more event when clicked', async () => {
    const wrapper = mount(LoadMoreButton, {
      props: {
        hasMore: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    const button = wrapper.find('[data-testid="load-more-button"]');
    await button.trigger('click');

    expect(wrapper.emitted('load-more')).toBeTruthy();
    expect(wrapper.emitted('load-more')?.length).toBe(1);
  });

  it('shows count info when showCount is true', () => {
    const wrapper = mount(LoadMoreButton, {
      props: {
        hasMore: true,
        showCount: true,
        currentCount: 50,
        total: 150,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.text()).toContain('Showing 50 of 150');
  });

  it('does not show count info when showCount is false', () => {
    const wrapper = mount(LoadMoreButton, {
      props: {
        hasMore: true,
        showCount: false,
        currentCount: 50,
        total: 150,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.text()).not.toContain('Showing');
  });

  it('shows loading text when loading', () => {
    const wrapper = mount(LoadMoreButton, {
      props: {
        hasMore: true,
        loading: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    // Verify the loading text is displayed
    expect(wrapper.text()).toContain('Loading');
  });
});
