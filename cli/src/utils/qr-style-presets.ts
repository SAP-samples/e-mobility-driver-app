// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * QR Code Styling Presets
 * Clean, professional QR code styles
 */

import { StyledPreset } from './qr-style-types.js';

export const STYLED_PRESETS: Record<string, StyledPreset> = {
  standard: {
    name: 'Standard',
    description: 'Classic black & white QR code',
    dotsOptions: {
      type: 'square',
      color: '#000000',
    },
    cornersSquareOptions: {
      type: 'square',
      color: '#000000',
    },
    cornersDotOptions: {
      type: 'square',
      color: '#000000',
    },
    backgroundOptions: {
      color: '#FFFFFF',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.35,
      margin: 6,
    },
  },

  sapBlue: {
    name: 'SAP Blue',
    description: 'Professional SAP blue solid',
    dotsOptions: {
      type: 'dots',
      color: '#0070F2',
    },
    cornersSquareOptions: {
      type: 'extra-rounded',
      color: '#0070F2',
    },
    cornersDotOptions: {
      type: 'classy-rounded',
      color: '#00A8FF',
    },
    backgroundOptions: {
      color: '#F0F9FF',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 8,
    },
  },

  sapBlueGradient: {
    name: 'SAP Blue Gradient',
    description: 'Professional SAP blue with gradient',
    dotsOptions: {
      type: 'rounded',
      gradient: {
        type: 'linear',
        rotation: 0,
        colorStops: [
          { offset: 0, color: '#0070F2' },
          { offset: 1, color: '#00A8FF' },
        ],
      },
    },
    cornersSquareOptions: {
      type: 'extra-rounded',
      color: '#0070F2',
    },
    cornersDotOptions: {
      type: 'dot',
      color: '#0070F2',
    },
    backgroundOptions: {
      color: '#FFFFFF',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 8,
    },
  },

  ocean: {
    name: 'Ocean Blue',
    description: 'Deep ocean blue gradient',
    dotsOptions: {
      type: 'rounded',
      gradient: {
        type: 'linear',
        rotation: 90,
        colorStops: [
          { offset: 0, color: '#2E3192' },
          { offset: 0.5, color: '#1BFFFF' },
          { offset: 1, color: '#2E3192' },
        ],
      },
    },
    cornersSquareOptions: {
      type: 'extra-rounded',
      color: '#2E3192',
    },
    cornersDotOptions: {
      type: 'dot',
      color: '#1BFFFF',
    },
    backgroundOptions: {
      color: '#F0F9FF',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 8,
    },
  },
};

/**
 * Get a preset by name
 */
export function getPreset(name: string): StyledPreset {
  return STYLED_PRESETS[name] || STYLED_PRESETS.standard;
}

/**
 * Get all preset names
 */
export function getPresetNames(): string[] {
  return Object.keys(STYLED_PRESETS);
}

/**
 * Get preset choices for CLI prompts
 */
export function getPresetChoices(): Array<{ name: string; value: string }> {
  return Object.entries(STYLED_PRESETS).map(([key, preset]) => ({
    name: `${getPresetEmoji(key)} ${preset.name} - ${preset.description}`,
    value: key,
  }));
}

/**
 * Get emoji for preset
 */
function getPresetEmoji(preset: string): string {
  const emojiMap: Record<string, string> = {
    standard: '⚫',
    sapBlue: '💠',
    sapBlueGradient: '🔵',
    ocean: '🌊',
  };
  return emojiMap[preset] || '🎨';
}
