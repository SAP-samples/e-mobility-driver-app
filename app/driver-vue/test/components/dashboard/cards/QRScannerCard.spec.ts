// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';

import QRScannerCard from '@/components/dashboard/cards/QRScannerCard.vue';
import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
import { useQRScanner } from '@/composables/useQRScanner';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      qr: {
        title: 'Quick Start Charging',
        scan_title: 'Scan QR Code to Start Charging',
        scan_description: 'Point your camera at the QR code on the charging station',
        scan_button: 'Scan QR Code',
        browse_stations: 'Browse Stations',
        decrypting: 'Decrypting QR code...',
        processing: 'Starting charging session...',
      },
    },
  },
});

// Mock the composables
vi.mock('@/composables/useQRScanner', () => ({
  useQRScanner: vi.fn(),
}));

// Mock UI5 components
vi.mock('@ui5/webcomponents-fiori/dist/BarcodeScannerDialog.js', () => ({}));

describe('QRScannerCard', () => {
  let mockUseQRScanner: ReturnType<typeof useQRScanner>;

  beforeEach(() => {
    mockUseQRScanner = {
      error: ref<string | null>(null),
      isDecrypting: ref(false),
      handleScanResult: vi.fn(),
      handleScanError: vi.fn(),
      clearError: vi.fn(),
      isScanning: ref(false),
      lastScannedData: ref(null),
      parseQRData: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validateQRData: vi.fn(() => true) as any,
    };

    vi.mocked(useQRScanner).mockReturnValue(mockUseQRScanner);
  });

  const createWrapper = (props = {}) => {
    return mount(QRScannerCard, {
      props,
      global: {
        plugins: [i18n],
        components: {
          DashboardCardLayout,
        },
        stubs: {
          'ui5-icon': true,
          'ui5-button': {
            template:
              '<button @click="$emit(\'click\')" :data-testid="$attrs[\'data-testid\']" :disabled="$attrs.disabled"><slot /></button>',
          },
          'ui5-barcode-scanner-dialog': true,
          'ui5-busy-indicator': {
            template: '<div class="busy-indicator-stub" />',
          },
        },
      },
    });
  };

  describe('Component Rendering', () => {
    it('renders the component correctly', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('.qr-title').text()).toContain('Quick Start Charging');
      expect(wrapper.find('.qr-text h3').text()).toBe('Scan QR Code to Start Charging');
      expect(wrapper.find('.qr-text p').text()).toBe(
        'Point your camera at the QR code on the charging station',
      );
    });

    it('renders scan QR code button', () => {
      const wrapper = createWrapper();

      const scanButton = wrapper.find('[data-testid="scan-button"]');
      expect(scanButton.exists()).toBe(true);
      expect(scanButton.text()).toContain('Scan QR Code');
    });

    it('renders browse stations button', () => {
      const wrapper = createWrapper();

      const browseButton = wrapper.find('[data-testid="browse-button"]');
      expect(browseButton.exists()).toBe(true);
      expect(browseButton.text()).toContain('Browse Stations');
    });
  });

  describe('Error State', () => {
    it('displays scanner error when present', async () => {
      mockUseQRScanner.error.value = 'Scanner error occurred';
      const wrapper = createWrapper();

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.error-state').exists()).toBe(true);
      expect(wrapper.find('.error-message').text()).toBe('Scanner error occurred');
    });

    it('hides error state when no error', () => {
      mockUseQRScanner.error.value = null;
      const wrapper = createWrapper();

      expect(wrapper.find('.error-state').exists()).toBe(false);
    });
  });

  describe('User Interactions', () => {
    it('clears errors when scan button is clicked', async () => {
      const wrapper = createWrapper();

      const scanButton = wrapper.find('[data-testid="scan-button"]');
      await scanButton.trigger('click');

      expect(mockUseQRScanner.clearError).toHaveBeenCalled();
    });

    it('emits browseStations event when browse button is clicked', async () => {
      const wrapper = createWrapper();

      const browseButton = wrapper.find('[data-testid="browse-button"]');
      await browseButton.trigger('click');

      expect(wrapper.emitted('browseStations')).toHaveLength(1);
    });
  });

  describe('Component State', () => {
    it('shows QR scanner prompt by default', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('.qr-scanner-prompt').exists()).toBe(true);
      expect(wrapper.find('.qr-icon-large').exists()).toBe(true);
    });

    it('shows both action buttons by default', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="scan-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="browse-button"]').exists()).toBe(true);
    });
  });

  describe('Reactive State', () => {
    it('reacts to error state changes', async () => {
      const wrapper = createWrapper();

      // Initially no error
      expect(wrapper.find('.error-state').exists()).toBe(false);

      // Set error
      mockUseQRScanner.error.value = 'Test error';
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.error-state').exists()).toBe(true);
      expect(wrapper.find('.error-message').text()).toBe('Test error');

      // Clear error
      mockUseQRScanner.error.value = null;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.error-state').exists()).toBe(false);
    });

    it('shows decrypting state when isDecrypting is true', async () => {
      mockUseQRScanner.isDecrypting.value = true;
      const wrapper = createWrapper();

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.decrypting-state').exists()).toBe(true);
      expect(wrapper.find('.decrypting-state p').text()).toBe('Decrypting QR code...');
    });
  });

  describe('Busy State', () => {
    it('shows busy indicator when busy prop is true', async () => {
      const wrapper = createWrapper({ busy: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.busy-state').exists()).toBe(true);
      expect(wrapper.text()).toContain('Starting charging session...');
    });

    it('hides normal content when busy', () => {
      const wrapper = createWrapper({ busy: true });

      expect(wrapper.find('.qr-scanner-prompt').exists()).toBe(false);
      expect(wrapper.find('.busy-state').exists()).toBe(true);
    });

    it('disables scan button when busy', () => {
      const wrapper = createWrapper({ busy: true });

      const scanButton = wrapper.find('[data-testid="scan-button"]');
      expect(scanButton.attributes('disabled')).toBeDefined();
    });

    it('disables browse button when busy', () => {
      const wrapper = createWrapper({ busy: true });

      const browseButton = wrapper.find('[data-testid="browse-button"]');
      expect(browseButton.attributes('disabled')).toBeDefined();
    });

    it('shows normal content when not busy', () => {
      const wrapper = createWrapper({ busy: false });

      expect(wrapper.find('.qr-scanner-prompt').exists()).toBe(true);
      expect(wrapper.find('.busy-state').exists()).toBe(false);
    });

    it('enables buttons when not busy', () => {
      const wrapper = createWrapper({ busy: false });

      const scanButton = wrapper.find('[data-testid="scan-button"]');
      const browseButton = wrapper.find('[data-testid="browse-button"]');

      // When busy is false, disabled attribute should be 'false' (string) or undefined
      const scanDisabled = scanButton.attributes('disabled');
      const browseDisabled = browseButton.attributes('disabled');

      expect(scanDisabled === undefined || scanDisabled === 'false').toBe(true);
      expect(browseDisabled === undefined || browseDisabled === 'false').toBe(true);
    });

    it('shows processing message when busy', () => {
      const wrapper = createWrapper({ busy: true });

      expect(wrapper.find('.busy-state p').text()).toBe('Starting charging session...');
    });
  });

  describe('Scanner Dialog Functions', () => {
    it('handles scan success event', async () => {
      const wrapper = createWrapper();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const component = wrapper.vm as any;

      // Mock the barcode scanner dialog
      const mockDialog = { open: true };
      component.barcodeScannerDialog = mockDialog;

      // Mock successful QR scan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockUseQRScanner.handleScanResult as any).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (_scanResult: any, successCallback: any) => {
          await successCallback({ chargingStationId: 'EVSE-001', connectorId: 1 });
        },
      );

      const scanEvent = {
        detail: { text: '{"chargingStationId":"EVSE-001","connectorId":1}' },
      } as CustomEvent;

      await component.handleScanSuccess(scanEvent);

      expect(mockUseQRScanner.handleScanResult).toHaveBeenCalled();
      expect(mockDialog.open).toBe(false);
    });

    it('handles scan error event', async () => {
      const wrapper = createWrapper();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const component = wrapper.vm as any;

      // Mock the barcode scanner dialog
      component.barcodeScannerDialog = { open: true };

      const errorEvent = {
        detail: { message: 'Camera access denied' },
      } as CustomEvent;

      await component.handleScanError(errorEvent);

      expect(mockUseQRScanner.handleScanError).toHaveBeenCalledWith(
        'Camera access denied',
        expect.any(Function),
      );
      expect(component.barcodeScannerDialog.open).toBe(false);
    });

    it('handles scan error with default message', async () => {
      const wrapper = createWrapper();
      const component = wrapper.vm as any;

      // Mock the barcode scanner dialog
      component.barcodeScannerDialog = { open: true };

      const errorEvent = {
        detail: {},
      } as CustomEvent;

      await component.handleScanError(errorEvent);

      expect(mockUseQRScanner.handleScanError).toHaveBeenCalledWith(
        'Failed to scan QR code',
        expect.any(Function),
      );
    });
  });

  describe('QR Code Processing', () => {
    it('emits qr-scanned event when QR is successfully scanned', async () => {
      const wrapper = createWrapper();
      const component = wrapper.vm as any;

      const qrData = { chargingStationId: 'EVSE-001', connectorId: 1 };
      await component.handleQRScanned(qrData);

      expect(wrapper.emitted('qrScanned')).toEqual([[qrData]]);
    });

    it('emits error event when QR scanning fails', async () => {
      const wrapper = createWrapper();
      const component = wrapper.vm as any;

      const errorMessage = 'QR scan failed';
      component.handleScanErrorInternal(errorMessage);

      expect(wrapper.emitted('error')).toEqual([[errorMessage]]);
    });
  });

  describe('Component Integration', () => {
    it('integrates with useQRScanner composable', () => {
      createWrapper();

      expect(useQRScanner).toHaveBeenCalled();
    });

    it('opens barcode scanner when dialog ref exists', async () => {
      const wrapper = createWrapper();
      const component = wrapper.vm as any;

      // Mock the barcode scanner dialog
      component.barcodeScannerDialog = { open: false };

      await component.openBarcodeScanner();

      expect(mockUseQRScanner.clearError).toHaveBeenCalled();
      expect(component.barcodeScannerDialog.open).toBe(true);
    });

    it('handles missing barcode scanner dialog gracefully', async () => {
      const wrapper = createWrapper();
      const component = wrapper.vm as any;

      // No barcode scanner dialog
      component.barcodeScannerDialog = null;

      // Should not throw error
      await component.openBarcodeScanner();

      expect(mockUseQRScanner.clearError).toHaveBeenCalled();
    });
  });

  describe('Event Emissions', () => {
    it('emits qr-scanned event with correct data', async () => {
      const wrapper = createWrapper();
      const component = wrapper.vm as any;

      const mockQRData = { chargingStationId: 'station-123', connectorId: 2 };
      component.handleQRScanned(mockQRData);

      expect(wrapper.emitted('qrScanned')).toEqual([[mockQRData]]);
    });

    it('emits browse-stations event', async () => {
      const wrapper = createWrapper();
      const component = wrapper.vm as any;

      component.onBrowseStations();

      expect(wrapper.emitted('browseStations')).toHaveLength(1);
    });

    it('emits error event with correct message', async () => {
      const wrapper = createWrapper();
      const component = wrapper.vm as any;

      const errorMessage = 'Test error message';
      component.handleScanErrorInternal(errorMessage);

      expect(wrapper.emitted('error')).toEqual([[errorMessage]]);
    });
  });
});
