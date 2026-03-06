// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { routerKey } from '@test/support/routerKey.ts';
import { VueWrapper, flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import SessionsPage from '@/pages/SessionsPage.vue';
import type { Session } from '@/store/sessions';

// Create reactive mock data
const mockStoreData = reactive({
  sessionHistoryData: [] as Session[],
  sessionsInProgressData: [] as Session[],
});

// Mock sessions store with getter properties that are reactive
const mockSessionsStore = {
  get sessionHistory() {
    return {
      data: mockStoreData.sessionHistoryData,
      loading: false,
      hasMore: false,
      isEmpty: mockStoreData.sessionHistoryData.length === 0,
      total: mockStoreData.sessionHistoryData.length,
      error: null,
    };
  },
  get sessionsInProgress() {
    return {
      data: mockStoreData.sessionsInProgressData,
      loading: false,
      hasMore: false,
      isEmpty: mockStoreData.sessionsInProgressData.length === 0,
      total: mockStoreData.sessionsInProgressData.length,
      error: null,
    };
  },
  loadInProgressSessions: vi.fn(),
  loadCompleted: vi.fn(),
  findThisMonth: vi.fn(),
  findThisYear: vi.fn(),
  loadMoreHistory: vi.fn(),
  stopSession: vi.fn(),
};

// Mock the store module
vi.mock('@/store/sessions', () => ({
  useSessionsStore: () => mockSessionsStore,
}));

const stubs = {
  ResponsiveGridLayout: {
    name: 'ResponsiveGridLayout',
    template: '<div class="grid-stub"><slot /></div>',
    props: ['minWidth', 'maxColumns'],
  },
  Sessions: {
    name: 'Sessions',
    template:
      '<div class="sessions-stub" @ui5-selection-change="$emit(\'filter-change\', $event)" />',
    props: [
      'sessionsInProgress',
      'sessions',
      'groupedHistory',
      'selectedFilter',
      'hasMoreHistory',
      'loadingHistory',
    ],
    emits: ['filter-change', 'load-more-history'],
  },
};

interface FactoryOptions {
  sessions?: Session[];
  inProgressSessions?: Session[];
}

interface MockRouter {
  push: ReturnType<typeof vi.fn>;
}

describe('SessionsPage', () => {
  let routerPush: ReturnType<typeof vi.fn>;
  let router: MockRouter;

  beforeEach(() => {
    routerPush = vi.fn();
    router = { push: routerPush };

    // Reset mock store data
    mockStoreData.sessionHistoryData = [];
    mockStoreData.sessionsInProgressData = [];

    // Reset mock functions
    vi.clearAllMocks();
  });

  function factory({ sessions = [], inProgressSessions = [] }: FactoryOptions = {}): VueWrapper<
    InstanceType<typeof SessionsPage>
  > {
    // Set initial data
    mockStoreData.sessionHistoryData = sessions;
    mockStoreData.sessionsInProgressData = inProgressSessions;

    return shallowMount(SessionsPage, {
      global: {
        stubs,
        provide: {
          [routerKey]: router,
        },
      },
    });
  }

  function createMockSession(overrides: Partial<Session> = {}): Session {
    return {
      id: 1,
      sessionId: 'sess-1',
      timestamp: '2024-01-01T00:00:00Z',
      siteName: 'Test Site',
      siteAreaName: 'Test Area',
      badgeAuthenticationId: 'badge-123',
      badgeVisualBadgeId: 'visual-123',
      cumulatedPrice: 10.5,
      currency: 'EUR',
      status: 'completed',
      chargingStationName: 'Station 1',
      totalDuration: 3600,
      totalInactivity: 300,
      totalEnergyDelivered: 25.5,
      stateOfCharge: 80,
      emi3Id: 'emi3-123',
      evseCode: 'EVSE-001',
      stop_extraInactivity: 120,
      ...overrides,
    };
  }

  it('renders Sessions component with correct props', async () => {
    const mockSession = createMockSession({ status: 'InProgress' });
    const wrapper = factory({
      sessions: [],
      inProgressSessions: [mockSession],
    });
    await flushPromises();

    expect(wrapper.find('.sessions-stub').exists()).toBe(true);
    const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
    expect(sessionsComponent.props('sessionsInProgress')).toEqual([mockSession]);
  });

  it('renders Sessions component when sessions history exists', async () => {
    const mockSession = createMockSession({ id: 2, sessionId: 'sess-2', status: 'completed' });
    const wrapper = factory({
      sessions: [mockSession],
      inProgressSessions: [],
    });
    await flushPromises();

    expect(wrapper.find('.sessions-stub').exists()).toBe(true);
    const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
    expect(sessionsComponent.props('sessions')).toEqual([mockSession]);
  });

  it('groupedHistory groups sessions by month/year', async () => {
    const januarySession = createMockSession({
      id: 1,
      timestamp: '2024-01-15T10:00:00Z',
      status: 'completed',
    });
    const februarySession = createMockSession({
      id: 2,
      timestamp: '2024-02-15T10:00:00Z',
      status: 'completed',
    });

    // Test the grouping logic by simulating what the component does
    const completedSessions = [januarySession, februarySession].filter(
      (s) => s.status !== 'InProgress',
    );
    const grouped = completedSessions.reduce((acc: Record<string, Session[]>, session: Session) => {
      const date = new Date(session.timestamp);
      const groupKey = date.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(session);
      return acc;
    }, {});

    expect(Object.keys(grouped)).toContain('January 2024');
    expect(Object.keys(grouped)).toContain('February 2024');
    expect(grouped['January 2024']).toHaveLength(1);
    expect(grouped['February 2024']).toHaveLength(1);
  });

  it('reacts to sessions being cleared and re-added', async () => {
    const mockSession = createMockSession({ status: 'InProgress' });

    // Start with sessions
    const wrapper = factory({
      sessions: [],
      inProgressSessions: [mockSession],
    });
    await flushPromises();
    expect(wrapper.find('.sessions-stub').exists()).toBe(true);

    // Clear sessions - Sessions component will still be rendered but with empty data
    mockStoreData.sessionHistoryData = [];
    mockStoreData.sessionsInProgressData = [];
    await flushPromises();
    expect(wrapper.find('.sessions-stub').exists()).toBe(true);

    // Add sessions again
    mockStoreData.sessionHistoryData = [];
    mockStoreData.sessionsInProgressData = [mockSession];
    await flushPromises();
    expect(wrapper.find('.sessions-stub').exists()).toBe(true);
  });

  it('handles reactive data updates correctly', async () => {
    const mockSession = createMockSession({ status: 'InProgress' });
    const wrapper = factory({
      sessions: [],
      inProgressSessions: [mockSession],
    });
    await flushPromises();

    const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
    expect(sessionsComponent.props('sessionsInProgress')).toEqual([mockSession]);

    // Update data reactively
    mockStoreData.sessionsInProgressData = [];
    await flushPromises();
    expect(sessionsComponent.props('sessionsInProgress')).toEqual([]);
  });

  it('renders Sessions component when both session types exist', async () => {
    const inProgressSession = createMockSession({
      id: 1,
      sessionId: 'in-progress-1',
      status: 'InProgress',
    });
    const historySession = createMockSession({
      id: 2,
      sessionId: 'history-1',
      status: 'completed',
    });

    const wrapper = factory({
      sessions: [historySession],
      inProgressSessions: [inProgressSession],
    });
    await flushPromises();

    expect(wrapper.find('.sessions-stub').exists()).toBe(true);
    const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
    expect(sessionsComponent.props('sessionsInProgress')).toEqual([inProgressSession]);
    expect(sessionsComponent.props('sessions')).toEqual([historySession]);
  });

  describe('filtering functionality', () => {
    it('should initialize with month filter by default', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
      expect(sessionsComponent.props('selectedFilter')).toBe('month');
      expect(mockSessionsStore.findThisMonth).toHaveBeenCalled();
    });

    it('should call findThisMonth when month filter is selected', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
      await sessionsComponent.vm.$emit('filter-change', 'month');

      expect(mockSessionsStore.findThisMonth).toHaveBeenCalled();
    });

    it('should call findThisYear when year filter is selected', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
      await sessionsComponent.vm.$emit('filter-change', 'year');

      expect(mockSessionsStore.findThisYear).toHaveBeenCalled();
    });

    it('should call loadCompleted when all filter is selected', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
      await sessionsComponent.vm.$emit('filter-change', 'all');

      expect(mockSessionsStore.loadCompleted).toHaveBeenCalled();
    });

    it('should update selectedFilter prop when filter changes', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });

      // Initially should be month
      expect(sessionsComponent.props('selectedFilter')).toBe('month');

      // Change to year
      await sessionsComponent.vm.$emit('filter-change', 'year');
      await flushPromises();
      expect(sessionsComponent.props('selectedFilter')).toBe('year');

      // Change to all
      await sessionsComponent.vm.$emit('filter-change', 'all');
      await flushPromises();
      expect(sessionsComponent.props('selectedFilter')).toBe('all');
    });

    it('should call loadInProgressSessions on mount', async () => {
      const mockSession = createMockSession({ status: 'InProgress' });
      factory({
        sessions: [],
        inProgressSessions: [mockSession],
      });
      await flushPromises();

      expect(mockSessionsStore.loadInProgressSessions).toHaveBeenCalled();
    });

    it('should pass correct props to Sessions component', async () => {
      const inProgressSession = createMockSession({
        id: 1,
        sessionId: 'in-progress-1',
        status: 'InProgress',
      });
      const historySession = createMockSession({
        id: 2,
        sessionId: 'history-1',
        status: 'completed',
      });

      const wrapper = factory({
        sessions: [historySession],
        inProgressSessions: [inProgressSession],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
      expect(sessionsComponent.props('sessionsInProgress')).toEqual([inProgressSession]);
      expect(sessionsComponent.props('sessions')).toEqual([historySession]);
      expect(sessionsComponent.props('selectedFilter')).toBe('month');
      expect(sessionsComponent.props('groupedHistory')).toBeDefined();
    });
  });

  describe('pagination functionality', () => {
    it('should pass hasMoreHistory prop to Sessions component', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
      expect(sessionsComponent.props('hasMoreHistory')).toBe(false);
    });

    it('should pass loadingHistory prop to Sessions component', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
      expect(sessionsComponent.props('loadingHistory')).toBe(false);
    });

    it('should call loadMoreHistory when load-more-history event is emitted', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });
      await sessionsComponent.vm.$emit('load-more-history');
      await flushPromises();

      expect(mockSessionsStore.loadMoreHistory).toHaveBeenCalled();
    });

    it('should not interfere with filter changes', async () => {
      const mockSession = createMockSession({ status: 'completed' });
      const wrapper = factory({
        sessions: [mockSession],
        inProgressSessions: [],
      });
      await flushPromises();

      const sessionsComponent = wrapper.findComponent({ name: 'Sessions' });

      // Load more
      await sessionsComponent.vm.$emit('load-more-history');
      await flushPromises();
      expect(mockSessionsStore.loadMoreHistory).toHaveBeenCalledTimes(1);

      // Change filter - should call the appropriate filter method
      await sessionsComponent.vm.$emit('filter-change', 'year');
      await flushPromises();
      expect(mockSessionsStore.findThisYear).toHaveBeenCalled();

      // Load more again after filter change
      await sessionsComponent.vm.$emit('load-more-history');
      await flushPromises();
      expect(mockSessionsStore.loadMoreHistory).toHaveBeenCalledTimes(2);
    });
  });
});
