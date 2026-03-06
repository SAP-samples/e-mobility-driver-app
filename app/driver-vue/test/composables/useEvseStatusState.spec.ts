// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { useEvseStatusState } from '@/composables/useEvseStatusState';

const {
  getEvseStatusState,
  computeEvseOcpiStatus,
  getEvseStatusDisplay,
  getConnectorOcpiStatusDisplay,
  isStationDisconnected,
  isEvseOperational,
  isReadyForCharging,
  isConnectorReadyForCharging,
} = useEvseStatusState();

type OcpiConnectorStatus =
  | 'AVAILABLE'
  | 'CHARGING'
  | 'FAULTED'
  | 'UNAVAILABLE'
  | 'RESERVED'
  | 'PREPARING'
  | 'FINISHING'
  | 'SUSPENDED_EV'
  | 'SUSPENDED_EVSE';

describe('useEvseStatusState', () => {
  describe('getEvseStatusState', () => {
    it('returns correct UI5 state for each OCPI status', () => {
      expect(getEvseStatusState('AVAILABLE')).toBe('Positive');
      expect(getEvseStatusState('OCCUPIED')).toBe('Information');
      expect(getEvseStatusState('INOPERATIVE')).toBe('Negative'); // Red for broken/inoperative by default
      expect(getEvseStatusState('OUTOFORDER')).toBe('Negative');
      expect(getEvseStatusState('RESERVED')).toBe('Critical');
      // @ts-expect-error: purposely testing unknown status
      expect(getEvseStatusState('UNKNOWN')).toBe('None');
    });

    it('returns gray/None for disconnected stations with INOPERATIVE status', () => {
      const now = new Date();
      const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000).toISOString();

      const disconnectedEvse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: fourMinutesAgo,
        },
      };

      expect(getEvseStatusState('INOPERATIVE', disconnectedEvse)).toBe('None');
    });

    it('returns red/Negative for regular inoperative stations', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const connectedEvse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'UNAVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: oneMinuteAgo,
        },
      };

      expect(getEvseStatusState('INOPERATIVE', connectedEvse)).toBe('Negative');
    });
  });

  describe('getEvseStatusDisplay', () => {
    it('returns capitalized display for each OCPI status', () => {
      expect(getEvseStatusDisplay('AVAILABLE')).toBe('Available');
      expect(getEvseStatusDisplay('OCCUPIED')).toBe('Occupied');
      expect(getEvseStatusDisplay('INOPERATIVE')).toBe('Inoperative');
      expect(getEvseStatusDisplay('OUTOFORDER')).toBe('Outoforder');
      expect(getEvseStatusDisplay('RESERVED')).toBe('Reserved');
    });
    it('returns empty string for falsy input', () => {
      // @ts-expect-error: purposely testing undefined/null/empty
      expect(getEvseStatusDisplay(undefined)).toBe('');
      // @ts-expect-error: purposely testing undefined/null/empty
      expect(getEvseStatusDisplay(null)).toBe('');
      // @ts-expect-error: purposely testing undefined/null/empty
      expect(getEvseStatusDisplay('')).toBe('');
    });
  });

  describe('getConnectorOcpiStatusDisplay', () => {
    it('returns correct display for each connector status', () => {
      expect(getConnectorOcpiStatusDisplay('AVAILABLE')).toBe('Available');
      expect(getConnectorOcpiStatusDisplay('CHARGING')).toBe('Occupied');
      expect(getConnectorOcpiStatusDisplay('FAULTED')).toBe('Outoforder');
      expect(getConnectorOcpiStatusDisplay('UNAVAILABLE')).toBe('Inoperative');
      expect(getConnectorOcpiStatusDisplay('RESERVED')).toBe('Reserved');
      expect(getConnectorOcpiStatusDisplay('PREPARING')).toBe('Preparing');
      expect(getConnectorOcpiStatusDisplay('FINISHING')).toBe('Occupied');
      expect(getConnectorOcpiStatusDisplay('SUSPENDEDEV')).toBe('Occupied');
      expect(getConnectorOcpiStatusDisplay('SUSPENDEDEVSE')).toBe('Occupied');
    });
    it('is case-insensitive', () => {
      expect(getConnectorOcpiStatusDisplay('available')).toBe('Available');
      expect(getConnectorOcpiStatusDisplay('charging')).toBe('Occupied');
      expect(getConnectorOcpiStatusDisplay('faulted')).toBe('Outoforder');
    });
    it('returns dash for unknown or falsy input', () => {
      expect(getConnectorOcpiStatusDisplay('UNKNOWN')).toBe('-');
      expect(getConnectorOcpiStatusDisplay(undefined)).toBe('-');
      // @ts-expect-error: purposely testing unknown/undefined/null
      expect(getConnectorOcpiStatusDisplay(null)).toBe('-');
      expect(getConnectorOcpiStatusDisplay('')).toBe('-');
    });
  });

  describe('computeEvseOcpiStatus', () => {
    it('returns INOPERATIVE for missing/empty connectors', () => {
      expect(computeEvseOcpiStatus()).toBe('INOPERATIVE');
      // @ts-expect-error: purposely testing empty object
      expect(computeEvseOcpiStatus({})).toBe('INOPERATIVE');
      // @ts-expect-error: purposely testing empty connectors
      expect(computeEvseOcpiStatus({ id: 'evse-1', connectors: [] })).toBe('INOPERATIVE');
    });
    it('returns correct OCPI status for connector statuses', () => {
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'AVAILABLE' as OcpiConnectorStatus }],
        }),
      ).toBe('AVAILABLE');
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'CHARGING' as OcpiConnectorStatus }],
        }),
      ).toBe('OCCUPIED');
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'FAULTED' as OcpiConnectorStatus }],
        }),
      ).toBe('OUTOFORDER');
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'UNAVAILABLE' as OcpiConnectorStatus }],
        }),
      ).toBe('INOPERATIVE');
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'RESERVED' as OcpiConnectorStatus }],
        }),
      ).toBe('RESERVED');
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'PREPARING' as OcpiConnectorStatus }],
        }),
      ).toBe('PREPARING');
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'FINISHING' as OcpiConnectorStatus }],
        }),
      ).toBe('OCCUPIED');
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'SUSPENDEDEV' as OcpiConnectorStatus }],
        }),
      ).toBe('OCCUPIED');
      expect(
        computeEvseOcpiStatus({
          // @ts-expect-error: purposely testing minimal object
          connectors: [{ connectorId: 1, status: 'SUSPENDEDEVSE' as OcpiConnectorStatus }],
        }),
      ).toBe('OCCUPIED');
    });
    it('returns first non-AVAILABLE OCPI status', () => {
      expect(
        computeEvseOcpiStatus({
          // @ts-expect-error: purposely testing minimal object
          connectors: [
            { connectorId: 1, status: 'AVAILABLE' as OcpiConnectorStatus },
            { connectorId: 2, status: 'CHARGING' as OcpiConnectorStatus },
          ],
        }),
      ).toBe('OCCUPIED');
      expect(
        computeEvseOcpiStatus({
          // @ts-expect-error: purposely testing minimal object
          connectors: [
            { connectorId: 1, status: 'AVAILABLE' as OcpiConnectorStatus },
            { connectorId: 2, status: 'FAULTED' as OcpiConnectorStatus },
          ],
        }),
      ).toBe('AVAILABLE');
    });

    it('returns CHARGING if any connector is charging, regardless of other statuses', () => {
      expect(
        computeEvseOcpiStatus({
          // @ts-expect-error: purposely testing minimal object
          connectors: [
            { connectorId: 1, status: 'AVAILABLE' },
            { connectorId: 2, status: 'FAULTED' },
            { connectorId: 3, status: 'CHARGING' },
            { connectorId: 4, status: 'UNAVAILABLE' },
          ],
        }),
      ).toBe('OCCUPIED');
      // PREPARING and RESERVED should also be treated as CHARGING
      expect(
        computeEvseOcpiStatus({
          // @ts-expect-error: purposely testing minimal object
          connectors: [
            { connectorId: 1, status: 'RESERVED' },
            { connectorId: 2, status: 'PREPARING' },
            { connectorId: 3, status: 'AVAILABLE' },
          ],
        }),
      ).toBe('PREPARING');
    });

    it('is case-insensitive and handles unknowns', () => {
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{ connectorId: 1, status: 'charging' as OcpiConnectorStatus }],
        }),
      ).toBe('OCCUPIED');
      // @ts-expect-error: purposely testing minimal object
      expect(computeEvseOcpiStatus({ connectors: [{ connectorId: 1, status: 'unknown' }] })).toBe(
        'INOPERATIVE',
      );
      // @ts-expect-error: purposely testing minimal object
      expect(computeEvseOcpiStatus({ connectors: [{ connectorId: 1, status: undefined }] })).toBe(
        'INOPERATIVE',
      );
      // @ts-expect-error: purposely testing unknown/undefined/null
      expect(computeEvseOcpiStatus({ connectors: [{ connectorId: 1, status: null }] })).toBe(
        'INOPERATIVE',
      );
    });
    it('handles malformed connectors array', () => {
      // @ts-expect-error: purposely testing null/undefined in array
      expect(computeEvseOcpiStatus({ connectors: [null, undefined] })).toBe('INOPERATIVE');
      expect(
        // @ts-expect-error: purposely testing minimal object
        computeEvseOcpiStatus({
          connectors: [{}, { connectorId: 1, status: 'CHARGING' as OcpiConnectorStatus }],
        }),
      ).toBe('OCCUPIED');
    });
  });
});

describe('isReadyForCharging', () => {
  it('should return true when EVSE is operational and has ready connectors', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

    const evse = {
      id: 'evse-1',
      connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
      chargingStation: {
        id: 'station-1',
        lastSeenAt: oneMinuteAgo,
      },
    };

    expect(isReadyForCharging(evse)).toBe(true);
  });

  it('should return true when EVSE has PREPARING connectors', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

    const evse = {
      id: 'evse-1',
      connectors: [{ connectorId: 1, status: 'PREPARING' }],
      chargingStation: {
        id: 'station-1',
        lastSeenAt: oneMinuteAgo,
      },
    };

    expect(isReadyForCharging(evse)).toBe(true);
  });

  it('should return false when EVSE is not operational', () => {
    const now = new Date();
    const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000).toISOString();

    const evse = {
      id: 'evse-1',
      connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
      chargingStation: {
        id: 'station-1',
        lastSeenAt: fourMinutesAgo,
      },
    };

    expect(isReadyForCharging(evse)).toBe(false);
  });

  it('should return false when all connectors are occupied', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

    const evse = {
      id: 'evse-1',
      connectors: [
        { connectorId: 1, status: 'CHARGING' },
        { connectorId: 2, status: 'FINISHING' },
      ],
      chargingStation: {
        id: 'station-1',
        lastSeenAt: oneMinuteAgo,
      },
    };

    expect(isReadyForCharging(evse)).toBe(false);
  });

  it('should return false when EVSE has mixed connectors with charging priority', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

    const evse = {
      id: 'evse-1',
      connectors: [
        { connectorId: 1, status: 'CHARGING' },
        { connectorId: 2, status: 'AVAILABLE' },
      ],
      chargingStation: {
        id: 'station-1',
        lastSeenAt: oneMinuteAgo,
      },
    };

    // OCCUPIED status takes priority over AVAILABLE, so EVSE is not ready for charging
    expect(isReadyForCharging(evse)).toBe(false);
  });

  it('should return true when at least one connector is ready and no higher priority statuses', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

    const evse = {
      id: 'evse-1',
      connectors: [
        { connectorId: 1, status: 'FAULTED' },
        { connectorId: 2, status: 'AVAILABLE' },
      ],
      chargingStation: {
        id: 'station-1',
        lastSeenAt: oneMinuteAgo,
      },
    };

    expect(isReadyForCharging(evse)).toBe(true);
  });

  it('should return false when EVSE is undefined', () => {
    expect(isReadyForCharging(undefined)).toBe(false);
  });

  it('should return false when EVSE has no connectors', () => {
    const evse = {
      id: 'evse-1',
      connectors: [],
    };

    expect(isReadyForCharging(evse)).toBe(false);
  });

  it('should return false when station is disabled', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

    const evse = {
      id: 'evse-1',
      connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
      chargingStation: {
        id: 'station-1',
        lastSeenAt: oneMinuteAgo,
        disabled: true,
      },
    };

    expect(isReadyForCharging(evse)).toBe(false);
  });
});

describe('isConnectorReadyForCharging', () => {
  it('should return true for AVAILABLE connector', () => {
    const connector = { connectorId: 1, status: 'AVAILABLE' };
    expect(isConnectorReadyForCharging(connector)).toBe(true);
  });

  it('should return true for PREPARING connector', () => {
    const connector = { connectorId: 1, status: 'PREPARING' };
    expect(isConnectorReadyForCharging(connector)).toBe(true);
  });

  it('should return false for CHARGING connector', () => {
    const connector = { connectorId: 1, status: 'CHARGING' };
    expect(isConnectorReadyForCharging(connector)).toBe(false);
  });

  it('should return false for FAULTED connector', () => {
    const connector = { connectorId: 1, status: 'FAULTED' };
    expect(isConnectorReadyForCharging(connector)).toBe(false);
  });

  it('should return false for UNAVAILABLE connector', () => {
    const connector = { connectorId: 1, status: 'UNAVAILABLE' };
    expect(isConnectorReadyForCharging(connector)).toBe(false);
  });

  it('should return false for FINISHING connector', () => {
    const connector = { connectorId: 1, status: 'FINISHING' };
    expect(isConnectorReadyForCharging(connector)).toBe(false);
  });

  it('should return false for undefined connector', () => {
    expect(isConnectorReadyForCharging(undefined)).toBe(false);
  });

  it('should return false for connector without status', () => {
    const connector = { connectorId: 1 };
    expect(isConnectorReadyForCharging(connector)).toBe(false);
  });

  it('should handle case-insensitive status', () => {
    const connector = { connectorId: 1, status: 'available' };
    expect(isConnectorReadyForCharging(connector)).toBe(true);
  });

  it('should return false for unknown status', () => {
    const connector = { connectorId: 1, status: 'UNKNOWN' };
    expect(isConnectorReadyForCharging(connector)).toBe(false);
  });
});

describe('Station Connectivity Functions', () => {
  describe('isStationDisconnected', () => {
    it('should return true when station has not been seen for over 3 minutes', () => {
      const now = new Date();
      const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: fourMinutesAgo,
        },
      };

      expect(isStationDisconnected(evse)).toBe(true);
    });

    it('should return false when station was seen within 3 minutes', () => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: twoMinutesAgo,
        },
      };

      expect(isStationDisconnected(evse)).toBe(false);
    });

    it('should return false when lastSeenAt is undefined', () => {
      const evse = {
        id: 'evse-1',
        connectors: [],
      };

      expect(isStationDisconnected(evse)).toBe(false);
    });

    it('should return false when lastSeenAt is empty string', () => {
      const evse = {
        id: 'evse-1',
        connectors: [],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: '',
        },
      };

      expect(isStationDisconnected(evse)).toBe(false);
    });

    it('should handle invalid date strings gracefully', () => {
      const evse = {
        id: 'evse-1',
        connectors: [],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: 'invalid-date',
        },
      };

      expect(isStationDisconnected(evse)).toBe(false);
    });

    it('should handle edge case exactly at 3 minute threshold', () => {
      const now = new Date();
      const exactlyThreeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: exactlyThreeMinutesAgo,
        },
      };

      expect(isStationDisconnected(evse)).toBe(true);
    });

    it('should handle edge case just under 3 minute threshold', () => {
      const now = new Date();
      const justUnderThreeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000 + 1000).toISOString(); // 2:59

      const evse = {
        id: 'evse-1',
        connectors: [],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: justUnderThreeMinutesAgo,
        },
      };

      expect(isStationDisconnected(evse)).toBe(false);
    });
  });

  describe('isEvseOperational', () => {
    it('should return false when station is disconnected', () => {
      const now = new Date();
      const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: fourMinutesAgo,
        },
      };

      expect(isEvseOperational(evse)).toBe(false);
    });

    it('should return false when station is disabled', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: oneMinuteAgo,
          disabled: true,
        },
      };

      expect(isEvseOperational(evse)).toBe(false);
    });

    it('should return true when station is connected and has operational connectors', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: oneMinuteAgo,
        },
      };

      expect(isEvseOperational(evse)).toBe(true);
    });

    it('should return false when station is connected but has no operational connectors', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'FAULTED' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: oneMinuteAgo,
        },
      };

      expect(isEvseOperational(evse)).toBe(false);
    });

    it('should return true when no station info is available but has operational connectors', () => {
      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
      };

      expect(isEvseOperational(evse)).toBe(true);
    });

    it('should return false when evse is undefined', () => {
      expect(isEvseOperational()).toBe(false);
    });
  });

  describe('computeEvseOcpiStatus with station connectivity', () => {
    it('should return "INOPERATIVE" when station is disconnected regardless of connector status', () => {
      const now = new Date();
      const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: fourMinutesAgo,
        },
      };

      expect(computeEvseOcpiStatus(evse)).toBe('INOPERATIVE');
    });

    it('should return "INOPERATIVE" when station is disabled', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: oneMinuteAgo,
          disabled: true,
        },
      };

      expect(computeEvseOcpiStatus(evse)).toBe('INOPERATIVE');
    });

    it('should use connector status when station is connected and enabled', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: oneMinuteAgo,
        },
      };

      expect(computeEvseOcpiStatus(evse)).toBe('AVAILABLE');
    });

    it('should prioritize station disconnection over connector charging status', () => {
      const now = new Date();
      const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'CHARGING' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: fourMinutesAgo,
        },
      };

      expect(computeEvseOcpiStatus(evse)).toBe('INOPERATIVE');
    });
  });

  describe('getEvseStatusDisplay with station connectivity', () => {
    it('should return "Disconnected" when station is disconnected', () => {
      const now = new Date();
      const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: fourMinutesAgo,
        },
      };

      const ocpiStatus = computeEvseOcpiStatus(evse);
      expect(getEvseStatusDisplay(ocpiStatus, evse)).toBe('Disconnected');
    });

    it('should return connector-based status when station is connected', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: oneMinuteAgo,
        },
      };

      const ocpiStatus = computeEvseOcpiStatus(evse);
      expect(getEvseStatusDisplay(ocpiStatus, evse)).toBe('Available');
    });

    it('should return "Inoperative" for station disabled status', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const evse = {
        id: 'evse-1',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
        chargingStation: {
          id: 'station-1',
          lastSeenAt: oneMinuteAgo,
          disabled: true,
        },
      };

      const ocpiStatus = computeEvseOcpiStatus(evse);
      expect(getEvseStatusDisplay(ocpiStatus, evse)).toBe('Inoperative');
    });
  });
});
