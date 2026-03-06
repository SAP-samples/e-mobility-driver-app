// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SessionItem from '@/components/sessions/SessionItem.vue';
import Sessions from '@/components/sessions/Sessions.vue';
import type { Session, SessionTimeFilter } from '@/store/sessions';

// Mock UI5 components
vi.mock('@ui5/webcomponents/dist/SegmentedButton.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/SegmentedButtonItem.js', () => ({}));
vi.mock('@ui5/webcomponents-fiori/dist/Timeline.js', () => ({}));
vi.mock('@ui5/webcomponents-fiori/dist/TimelineGroupItem.js', () => ({}));

// Mock SessionItem component
vi.mock('@/components/sessions/SessionItem.vue', () => ({
  default: {
    name: 'SessionItem',
    template: '<div class="session-item">{{ session.id }}</div>',
    props: {
      session: Object,
    },
  },
}));

// Mock NoData component
vi.mock('@/components/shared/NoData.vue', () => ({
  default: {
    name: 'NoData',
    template: '<button class="nodata-stub" @click="$emit(\'action\')">NoData</button>',
    props: {
      title: String,
    },
    emits: ['action'],
  },
}));

// Mock LoadMoreButton component
vi.mock('@/components/shared/LoadMoreButton.vue', () => ({
  default: {
    name: 'LoadMoreButton',
    template: '<button class="load-more-stub" @click="$emit(\'load-more\')">Load More</button>',
    props: {
      hasMore: Boolean,
      loading: Boolean,
      total: Number,
      currentCount: Number,
      showCount: Boolean,
    },
    emits: ['load-more'],
  },
}));

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockSession: Session = {
  id: 1,
  sessionId: 'session-123',
  timestamp: '2024-01-15T10:30:00Z',
  siteName: 'Test Site',
  siteAreaName: 'Area A',
  badgeAuthenticationId: 'badge-auth-123',
  badgeVisualBadgeId: 'BADGE-123',
  cumulatedPrice: 25.5,
  currency: 'EUR',
  status: 'Completed',
  chargingStationName: 'Station 1',
  totalDuration: 120,
  totalInactivity: 10,
  totalEnergyDelivered: 45.5,
  stateOfCharge: 85,
  emi3Id: 'emi3-123',
  evseCode: 'EVSE-001',
  stop_extraInactivity: 5,
};

const mockInProgressSession: Session = {
  ...mockSession,
  id: 2,
  sessionId: 'session-456',
  status: 'InProgress',
};

describe('Sessions', () => {
  const defaultProps = {
    sessionsInProgress: [mockInProgressSession],
    sessions: [mockSession],
    groupedHistory: {
      'January 2024': [mockSession],
    },
    selectedFilter: 'month' as SessionTimeFilter,
    hasMoreHistory: false,
    loadingHistory: false,
  };

  const mountOptions = {
    global: {
      plugins: [createTestI18n()],
    },
  };

  it('should render sessions in progress', () => {
    const wrapper = mount(Sessions, {
      props: defaultProps,
      ...mountOptions,
    });

    const sessionItems = wrapper.findAllComponents(SessionItem);
    expect(sessionItems).toHaveLength(2); // 1 in progress + 1 completed
  });

  it('should render segmented button with correct filter selection', () => {
    const wrapper = mount(Sessions, {
      props: defaultProps,
      ...mountOptions,
    });

    const segmentedButton = wrapper.find('ui5-segmented-button');
    expect(segmentedButton.exists()).toBe(true);
    expect(segmentedButton.attributes('accessible-name')).toBe('Time filter');

    const monthButton = wrapper.find('[data-filter="month"]');
    const yearButton = wrapper.find('[data-filter="year"]');
    const allButton = wrapper.find('[data-filter="all"]');

    expect(monthButton.exists()).toBe(true);
    expect(yearButton.exists()).toBe(true);
    expect(allButton.exists()).toBe(true);

    // Check that month is selected
    expect(monthButton.attributes('selected')).toBe('true');
    expect(yearButton.attributes('selected')).toBe('false');
    expect(allButton.attributes('selected')).toBe('false');
  });

  it('should emit filter change when segmented button selection changes', async () => {
    const wrapper = mount(Sessions, {
      props: defaultProps,
      ...mountOptions,
    });

    const segmentedButton = wrapper.find('ui5-segmented-button');

    // Mock the selection change event
    const mockEvent = {
      detail: {
        selectedItems: [
          {
            getAttribute: vi.fn().mockReturnValue('year'),
          },
        ],
      },
    };

    await segmentedButton.trigger('ui5-selection-change', mockEvent);

    expect(wrapper.emitted('filterChange')).toBeTruthy();
    expect(wrapper.emitted('filterChange')?.[0]).toEqual(['year']);
  });

  it('should update selected filter when prop changes', async () => {
    const wrapper = mount(Sessions, {
      props: defaultProps,
      ...mountOptions,
    });

    // Initially month should be selected
    expect(wrapper.find('[data-filter="month"]').attributes('selected')).toBe('true');
    expect(wrapper.find('[data-filter="year"]').attributes('selected')).toBe('false');

    // Change to year filter
    await wrapper.setProps({ selectedFilter: 'year' });

    expect(wrapper.find('[data-filter="month"]').attributes('selected')).toBe('false');
    expect(wrapper.find('[data-filter="year"]').attributes('selected')).toBe('true');
  });

  it('should handle all filter selection', async () => {
    const wrapper = mount(Sessions, {
      props: {
        ...defaultProps,
        selectedFilter: 'all' as SessionTimeFilter,
      },
      ...mountOptions,
    });

    expect(wrapper.find('[data-filter="month"]').attributes('selected')).toBe('false');
    expect(wrapper.find('[data-filter="year"]').attributes('selected')).toBe('false');
    expect(wrapper.find('[data-filter="all"]').attributes('selected')).toBe('true');
  });

  it('should render empty sessions correctly', () => {
    const wrapper = mount(Sessions, {
      props: {
        sessionsInProgress: [],
        sessions: [],
        groupedHistory: {},
        selectedFilter: 'month' as SessionTimeFilter,
      },
      ...mountOptions,
    });

    const sessionItems = wrapper.findAllComponents(SessionItem);
    expect(sessionItems).toHaveLength(0);

    // Segmented button should still be present
    const segmentedButton = wrapper.find('ui5-segmented-button');
    expect(segmentedButton.exists()).toBe(true);
  });

  it('should pass correct props to SessionItem components', () => {
    const wrapper = mount(Sessions, {
      props: defaultProps,
      ...mountOptions,
    });

    const sessionItems = wrapper.findAllComponents(SessionItem);

    // Check in-progress session
    const inProgressItem = sessionItems[0];
    expect(inProgressItem.props('session')).toEqual(mockInProgressSession);

    // Check completed session
    const completedItem = sessionItems[1];
    expect(completedItem.props('session')).toEqual(mockSession);
  });

  it('should handle multiple sessions in progress', () => {
    const additionalInProgressSession: Session = {
      ...mockInProgressSession,
      id: 3,
      sessionId: 'session-789',
    };

    const wrapper = mount(Sessions, {
      props: {
        ...defaultProps,
        sessionsInProgress: [mockInProgressSession, additionalInProgressSession],
      },
      ...mountOptions,
    });

    const sessionItems = wrapper.findAllComponents(SessionItem);
    expect(sessionItems).toHaveLength(3); // 2 in progress + 1 completed
  });

  it('should handle multiple completed sessions', () => {
    const additionalCompletedSession: Session = {
      ...mockSession,
      id: 4,
      sessionId: 'session-999',
    };

    const wrapper = mount(Sessions, {
      props: {
        ...defaultProps,
        sessions: [mockSession, additionalCompletedSession],
      },
      ...mountOptions,
    });

    const sessionItems = wrapper.findAllComponents(SessionItem);
    expect(sessionItems).toHaveLength(3); // 1 in progress + 2 completed
  });

  it('should maintain component structure with different filter selections', async () => {
    const wrapper = mount(Sessions, {
      props: defaultProps,
      ...mountOptions,
    });

    // Test each filter option
    const filters: SessionTimeFilter[] = ['month', 'year', 'all'];

    for (const filter of filters) {
      await wrapper.setProps({ selectedFilter: filter });

      // Should always have the segmented button
      expect(wrapper.find('ui5-segmented-button').exists()).toBe(true);

      // Should always render session items
      const sessionItems = wrapper.findAllComponents(SessionItem);
      expect(sessionItems.length).toBeGreaterThanOrEqual(0);

      // Correct filter should be selected
      expect(wrapper.find(`[data-filter="${filter}"]`).attributes('selected')).toBe('true');
    }
  });

  it('should handle filter change event with proper typing', async () => {
    const wrapper = mount(Sessions, {
      props: defaultProps,
      ...mountOptions,
    });

    const segmentedButton = wrapper.find('ui5-segmented-button');

    // Test each filter type
    const filterTests = [
      { filter: 'month', expected: 'month' },
      { filter: 'year', expected: 'year' },
      { filter: 'all', expected: 'all' },
    ];

    for (const test of filterTests) {
      const mockEvent = {
        detail: {
          selectedItems: [
            {
              getAttribute: vi.fn().mockReturnValue(test.filter),
            },
          ],
        },
      };

      await segmentedButton.trigger('ui5-selection-change', mockEvent);
    }

    const emittedEvents = wrapper.emitted('filterChange');
    expect(emittedEvents).toHaveLength(3);
    expect(emittedEvents?.[0]).toEqual(['month']);
    expect(emittedEvents?.[1]).toEqual(['year']);
    expect(emittedEvents?.[2]).toEqual(['all']);
  });

  it('should have proper CSS classes', () => {
    const wrapper = mount(Sessions, {
      props: defaultProps,
      ...mountOptions,
    });

    const segmentedButton = wrapper.find('ui5-segmented-button');
    expect(segmentedButton.classes()).toContain('right');
  });

  it('should handle edge case with undefined grouped history', () => {
    const wrapper = mount(Sessions, {
      props: {
        ...defaultProps,
        groupedHistory: undefined,
      },
      ...mountOptions,
    });

    // Should still render without errors
    expect(wrapper.find('ui5-segmented-button').exists()).toBe(true);
    const sessionItems = wrapper.findAllComponents(SessionItem);
    expect(sessionItems).toHaveLength(2);
  });

  describe('NoData functionality', () => {
    beforeEach(() => {
      mockPush.mockClear();
    });

    it('should show NoData when no sessions exist', () => {
      const wrapper = mount(Sessions, {
        props: {
          sessionsInProgress: [],
          sessions: [],
          groupedHistory: {},
          selectedFilter: 'month' as SessionTimeFilter,
          hasMoreHistory: false,
          loadingHistory: false,
        },
        ...mountOptions,
      });

      const noDataComponent = wrapper.find('.nodata-stub');
      expect(noDataComponent.exists()).toBe(true);

      const sessionItems = wrapper.findAllComponents(SessionItem);
      expect(sessionItems).toHaveLength(0);
    });

    it('should show NoData when sessions in progress exist but no session in the listed tab', () => {
      const wrapper = mount(Sessions, {
        props: {
          sessionsInProgress: [mockInProgressSession],
          sessions: [],
          groupedHistory: {},
          selectedFilter: 'month' as SessionTimeFilter,
          hasMoreHistory: false,
          loadingHistory: false,
        },
        ...mountOptions,
      });

      const noDataComponent = wrapper.find('.nodata-stub');
      expect(noDataComponent.exists()).toBe(true);

      const sessionItems = wrapper.findAllComponents(SessionItem);
      expect(sessionItems).toHaveLength(1);
    });

    it('should not show NoData when completed sessions exist', () => {
      const wrapper = mount(Sessions, {
        props: {
          sessionsInProgress: [],
          sessions: [mockSession],
          groupedHistory: { 'January 2024': [mockSession] },
          selectedFilter: 'month' as SessionTimeFilter,
          hasMoreHistory: false,
          loadingHistory: false,
        },
        ...mountOptions,
      });

      const noDataComponent = wrapper.find('.nodata-stub');
      expect(noDataComponent.exists()).toBe(false);

      const sessionItems = wrapper.findAllComponents(SessionItem);
      expect(sessionItems).toHaveLength(1);
    });

    it('should not show NoData when both session types exist', () => {
      const wrapper = mount(Sessions, {
        props: defaultProps,
        ...mountOptions,
      });

      const noDataComponent = wrapper.find('.nodata-stub');
      expect(noDataComponent.exists()).toBe(false);

      const sessionItems = wrapper.findAllComponents(SessionItem);
      expect(sessionItems).toHaveLength(2);
    });

    it('should navigate to Home when NoData action is triggered', async () => {
      const wrapper = mount(Sessions, {
        props: {
          sessionsInProgress: [],
          sessions: [],
          groupedHistory: {},
          selectedFilter: 'month' as SessionTimeFilter,
          hasMoreHistory: false,
          loadingHistory: false,
        },
        ...mountOptions,
      });

      const noDataComponent = wrapper.find('.nodata-stub');
      expect(noDataComponent.exists()).toBe(true);

      await noDataComponent.trigger('click');

      expect(mockPush).toHaveBeenCalledWith({ name: 'Home' });
    });

    it('should handle null/undefined session arrays correctly', () => {
      const wrapper = mount(Sessions, {
        props: {
          sessionsInProgress: [] as Session[],
          sessions: [] as Session[],
          groupedHistory: {},
          selectedFilter: 'month' as SessionTimeFilter,
          hasMoreHistory: false,
          loadingHistory: false,
        },
        ...mountOptions,
      });

      const noDataComponent = wrapper.find('.nodata-stub');
      expect(noDataComponent.exists()).toBe(true);

      const sessionItems = wrapper.findAllComponents(SessionItem);
      expect(sessionItems).toHaveLength(0);
    });

    it('should pass correct title to NoData component', () => {
      const wrapper = mount(Sessions, {
        props: {
          sessionsInProgress: [],
          sessions: [],
          groupedHistory: {},
          selectedFilter: 'month' as SessionTimeFilter,
          hasMoreHistory: false,
          loadingHistory: false,
        },
        ...mountOptions,
      });

      const noDataComponent = wrapper.findComponent({ name: 'NoData' });
      expect(noDataComponent.exists()).toBe(true);
      expect(noDataComponent.props('title')).toBe('No sessions found');
    });
  });

  describe('LoadMoreButton functionality', () => {
    it('should show LoadMoreButton when hasMoreHistory is true', () => {
      const wrapper = mount(Sessions, {
        props: {
          ...defaultProps,
          hasMoreHistory: true,
        },
        ...mountOptions,
      });

      const loadMoreButton = wrapper.findComponent({ name: 'LoadMoreButton' });
      expect(loadMoreButton.exists()).toBe(true);
      expect(loadMoreButton.props('hasMore')).toBe(true);
    });

    it('should not show LoadMoreButton when hasMoreHistory is false', () => {
      const wrapper = mount(Sessions, {
        props: {
          ...defaultProps,
          hasMoreHistory: false,
        },
        ...mountOptions,
      });

      const loadMoreButton = wrapper.findComponent({ name: 'LoadMoreButton' });
      expect(loadMoreButton.props('hasMore')).toBe(false);
    });

    it('should pass loading state to LoadMoreButton', () => {
      const wrapper = mount(Sessions, {
        props: {
          ...defaultProps,
          hasMoreHistory: true,
          loadingHistory: true,
        },
        ...mountOptions,
      });

      const loadMoreButton = wrapper.findComponent({ name: 'LoadMoreButton' });
      expect(loadMoreButton.props('loading')).toBe(true);
    });

    it('should emit load-more-history when LoadMoreButton is clicked', async () => {
      const wrapper = mount(Sessions, {
        props: {
          ...defaultProps,
          hasMoreHistory: true,
        },
        ...mountOptions,
      });

      const loadMoreButton = wrapper.find('.load-more-stub');
      await loadMoreButton.trigger('click');

      expect(wrapper.emitted('load-more-history')).toBeTruthy();
      expect(wrapper.emitted('load-more-history')?.length).toBe(1);
    });

    it('should not show LoadMoreButton when no sessions exist', () => {
      const wrapper = mount(Sessions, {
        props: {
          sessionsInProgress: [],
          sessions: [],
          groupedHistory: {},
          selectedFilter: 'month' as SessionTimeFilter,
          hasMoreHistory: true,
          loadingHistory: false,
        },
        ...mountOptions,
      });

      // LoadMoreButton should not be visible because NoData is shown
      const loadMoreButton = wrapper.findComponent({ name: 'LoadMoreButton' });
      expect(loadMoreButton.exists()).toBe(false);
    });
  });
});
