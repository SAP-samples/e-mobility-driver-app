// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * QR Code Styling Types
 * Type definitions for QR code styling with qr-code-styling library
 */

export type QRStyleMode = 'styled';

export type DotType = 'rounded' | 'dots' | 'classy' | 'square' | 'classy-rounded' | 'extra-rounded';
export type CornerSquareType =
  | 'dot'
  | 'square'
  | 'extra-rounded'
  | 'rounded'
  | 'dots'
  | 'classy'
  | 'classy-rounded';
export type CornerDotType =
  | 'dot'
  | 'square'
  | 'rounded'
  | 'dots'
  | 'classy'
  | 'classy-rounded'
  | 'extra-rounded';
export type GradientType = 'linear' | 'radial';

export interface ColorStop {
  offset: number;
  color: string;
}

export interface Gradient {
  type: GradientType;
  rotation?: number;
  colorStops: ColorStop[];
}

export interface DotsOptions {
  type?: DotType;
  color?: string;
  gradient?: Gradient;
}

export interface CornersSquareOptions {
  type?: CornerSquareType;
  color?: string;
  gradient?: Gradient;
}

export interface CornersDotOptions {
  type?: CornerDotType;
  color?: string;
  gradient?: Gradient;
}

export interface BackgroundOptions {
  color?: string;
  gradient?: Gradient;
}

export interface ImageOptions {
  hideBackgroundDots?: boolean;
  imageSize?: number;
  margin?: number;
  crossOrigin?: string;
}

export interface StyledConfig {
  preset?: 'standard' | 'sapBlue' | 'sapBlueGradient' | 'ocean';
  dotsOptions?: DotsOptions;
  cornersSquareOptions?: CornersSquareOptions;
  cornersDotOptions?: CornersDotOptions;
  backgroundOptions?: BackgroundOptions;
  imageOptions?: ImageOptions;
}

export interface QRStyleConfig {
  mode: QRStyleMode;
  styled?: StyledConfig;
  width?: number;
  height?: number;
  image?: string;
}

export interface StyledPreset {
  name: string;
  description?: string;
  dotsOptions: DotsOptions;
  cornersSquareOptions?: CornersSquareOptions;
  cornersDotOptions?: CornersDotOptions;
  backgroundOptions?: BackgroundOptions;
  imageOptions?: ImageOptions;
}
