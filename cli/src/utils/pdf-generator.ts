// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'path';

import fs from 'fs-extra';
import PDFDocument from 'pdfkit';

import { QRData, QRGenerator } from './qr-generator';
import type { QRStyleConfig } from './qr-style-types';

export interface EVSEInfo {
  id: string;
  name?: string;
  code?: string;
  emi3Id?: string;
  chargingStationId: string;
  chargingStationName?: string;
  location?: {
    siteAreaName?: string;
    siteName?: string;
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
  };
  connectors: Array<{
    connectorId: number;
    type?: string;
    currentType?: string;
    voltage?: number;
    current?: number;
    maximumPower?: number;
    numberOfPhases?: number;
  }>;
}

export interface PDFGenerationOptions {
  outputPath: string;
  format?: 'A4' | 'Letter' | 'Sticker';
  margin?: number;
  title?: string;
  subtitle?: string;
  footer?: string;
  branding?: {
    title?: string;
    subtitle?: string;
    logo?: string; // Path to logo file
  };
  // Sticker-specific options
  stickerTitle?: string; // Optional title for sticker format
  logoPath?: string; // Optional logo path to overlay on QR code (sticker format only)
  // QR Style configuration
  qrStyleConfig?: QRStyleConfig;
}

export class PDFGenerator {
  private static readonly DEFAULT_OPTIONS: Partial<PDFGenerationOptions> = {
    format: 'A4',
    margin: 50,
    title: 'E-Mobility Quick Start',
    subtitle: 'Scan QR Code to Start Charging',
    footer: 'Scan with your E-Mobility app to start a charging session',
  };

  /**
   * Generate professional PDF with QR codes for EVSEs
   */
  static async generateQRCodePDF(
    evses: EVSEInfo[],
    options: PDFGenerationOptions,
    encryptionKey?: string,
  ): Promise<string> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    // Ensure output directory exists
    await fs.ensureDir(path.dirname(options.outputPath));

    // Check if sticker format is requested
    if (mergedOptions.format === 'Sticker') {
      return this.generateStickerPDF(evses, options, encryptionKey);
    }

    const doc = new PDFDocument({
      size: mergedOptions.format,
      margin: mergedOptions.margin,
      info: {
        Title: mergedOptions.title,
        Subject: 'EVSE QR Codes for Quick Charging',
        Author: 'E-Mobility Driver App',
        Creator: 'E-Mobility CLI',
      },
    });

    const stream = fs.createWriteStream(options.outputPath);
    doc.pipe(stream);

    let pageCount = 0;

    // Process each EVSE (one QR code per EVSE, not per connector)
    for (const evse of evses) {
      if (pageCount > 0) {
        doc.addPage();
      }

      await this.generateQRPage(doc, evse, mergedOptions, encryptionKey);
      pageCount++;
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(options.outputPath);
      });

      stream.on('error', (error) => {
        reject(new Error(`Failed to write PDF: ${error.message}`));
      });
    });
  }

  /**
   * Generate a single page with QR code and EVSE information
   */
  private static async generateQRPage(
    doc: any,
    evse: EVSEInfo,
    options: Partial<PDFGenerationOptions>,
    encryptionKey?: string,
  ): Promise<void> {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = options.margin || 50;
    const contentWidth = pageWidth - 2 * margin;

    // Header Section
    this.addHeader(doc, options, margin, contentWidth);

    // Main Content Area
    const qrData: QRData = {
      evseId: evse.id, // Use the EVSE ID directly
    };

    try {
      // Generate QR code with style config
      const qrBuffer = await QRGenerator.generateQR(qrData, encryptionKey, options.qrStyleConfig);

      // Center QR code
      const qrSize = 250;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 150;

      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // EVSE Information Card
      this.addEVSEInfoCard(doc, evse, qrY + qrSize + 30, margin, contentWidth);

      // Footer
      this.addFooter(doc, options, pageHeight - margin - 30, margin, contentWidth);
    } catch (error) {
      // Fallback: show error message instead of QR code
      doc
        .fontSize(16)
        .fillColor('red')
        .text(
          `Error generating QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
          margin,
          200,
          { width: contentWidth, align: 'center' },
        );
    }
  }

  /**
   * Add header section with branding
   */
  private static addHeader(
    doc: any,
    options: Partial<PDFGenerationOptions>,
    margin: number,
    contentWidth: number,
  ): void {
    // Title
    doc
      .fontSize(24)
      .fillColor('#1f2937')
      .font('Helvetica-Bold')
      .text(options.title || 'E-Mobility Quick Start', margin, margin, {
        width: contentWidth,
        align: 'center',
      });

    // Subtitle
    doc
      .fontSize(14)
      .fillColor('#6b7280')
      .font('Helvetica')
      .text(options.subtitle || 'Scan QR Code to Start Charging', margin, margin + 35, {
        width: contentWidth,
        align: 'center',
      });

    // Separator line
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(margin + contentWidth * 0.25, margin + 65)
      .lineTo(margin + contentWidth * 0.75, margin + 65)
      .stroke();
  }

  /**
   * Add EVSE information card
   */
  private static addEVSEInfoCard(
    doc: any,
    evse: EVSEInfo,
    startY: number,
    margin: number,
    contentWidth: number,
  ): void {
    const cardY = startY;
    const cardHeight = 220;

    // Card background
    doc
      .rect(margin, cardY, contentWidth, cardHeight)
      .fillColor('#f9fafb')
      .fill()
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .stroke();

    const cardPadding = 20;
    const textX = margin + cardPadding;
    let currentY = cardY + cardPadding;

    // EVSE Code - Name (code first, then name)
    const evseTitle = evse.code
      ? `${evse.code}${evse.name ? ' - ' + evse.name : ''}`
      : evse.name || 'EVSE';

    doc.fontSize(18).fillColor('#1f2937').font('Helvetica-Bold').text(evseTitle, textX, currentY);
    currentY += 25;

    // Location
    if (evse.location) {
      const locationText = [
        evse.location.siteAreaName,
        evse.location.siteName,
        evse.location.address?.street,
        evse.location.address?.city,
      ]
        .filter(Boolean)
        .join(', ');

      if (locationText) {
        doc
          .fontSize(12)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(`Location: ${locationText}`, textX, currentY, {
            width: contentWidth - 2 * cardPadding,
          });
        currentY += 20;
      }
    }

    // Connectors Information
    doc
      .fontSize(14)
      .fillColor('#1f2937')
      .font('Helvetica-Bold')
      .text(`Connectors (${evse.connectors.length})`, textX, currentY);
    currentY += 18;

    // List all connectors
    evse.connectors.forEach((connector, index) => {
      const connectorDetails = [];
      connectorDetails.push(`#${connector.connectorId}`);
      if (connector.type) connectorDetails.push(connector.type);
      if (connector.maximumPower) {
        const powerValue =
          connector.maximumPower > 1000
            ? Math.round(connector.maximumPower / 1000)
            : connector.maximumPower;
        connectorDetails.push(`${powerValue}kW`);
      }

      doc
        .fontSize(11)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text(connectorDetails.join(' • '), textX, currentY);
      currentY += 14;

      // Add spacing between connectors, but not after the last one
      if (index < evse.connectors.length - 1) {
        currentY += 2;
      }
    });

    currentY += 6;

    // Technical IDs (smaller text)
    const technicalInfo = [];
    if (evse.emi3Id) technicalInfo.push(`eMI³ ID: ${evse.emi3Id}`);
    if (evse.chargingStationId)
      technicalInfo.push(`Station ID: ${evse.chargingStationId.substring(0, 8)}...`);

    if (technicalInfo.length > 0) {
      doc
        .fontSize(9)
        .fillColor('#9ca3af')
        .font('Helvetica')
        .text(technicalInfo.join(' • '), textX, currentY);
    }
  }

  /**
   * Add footer with instructions
   */
  private static addFooter(
    doc: any,
    options: Partial<PDFGenerationOptions>,
    y: number,
    margin: number,
    contentWidth: number,
  ): void {
    // Instructions
    doc
      .fontSize(12)
      .fillColor('#6b7280')
      .font('Helvetica')
      .text(
        options.footer || 'Scan with your E-Mobility app to start a charging session',
        margin,
        y,
        {
          width: contentWidth,
          align: 'center',
        },
      );

    // Generation timestamp
    const timestamp = new Date().toLocaleString();
    doc
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(`Generated: ${timestamp}`, margin, y + 20, {
        width: contentWidth,
        align: 'center',
      });
  }

  /**
   * Generate PDF with multiple 5x7cm stickers per page
   */
  private static async generateStickerPDF(
    evses: EVSEInfo[],
    options: PDFGenerationOptions,
    encryptionKey?: string,
  ): Promise<string> {
    // Sticker dimensions in points (1cm = 28.35 points)
    const stickerWidth = 141.73; // 5cm
    const stickerHeight = 198.42; // 7cm (increased from 5cm)
    // A4 page dimensions in points
    const pageWidth = 595.28; // A4 width
    const pageHeight = 841.89; // A4 height
    // Calculate grid layout (4 columns x 4 rows = 16 stickers per page)
    const cols = 4;
    const rows = 4; // Reduced from 5 to 4 due to increased height
    const horizontalSpacing = (pageWidth - cols * stickerWidth) / (cols + 1);
    const verticalSpacing = (pageHeight - rows * stickerHeight) / (rows + 1);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: 'EVSE QR Code Stickers',
        Subject: 'EVSE QR Code Stickers for Quick Charging',
        Author: 'E-Mobility Driver App',
        Creator: 'E-Mobility CLI',
      },
    });

    const stream = fs.createWriteStream(options.outputPath);
    doc.pipe(stream);

    let stickerCount = 0;

    for (const evse of evses) {
      // Calculate position on grid
      const positionOnPage = stickerCount % (cols * rows);
      const col = positionOnPage % cols;
      const row = Math.floor(positionOnPage / cols);

      // Add new page if needed
      if (stickerCount > 0 && positionOnPage === 0) {
        doc.addPage();
      }

      // Calculate sticker position
      const x = horizontalSpacing + col * (stickerWidth + horizontalSpacing);
      const y = verticalSpacing + row * (stickerHeight + verticalSpacing);

      // Generate sticker
      await this.generateSticker(
        doc,
        evse,
        x,
        y,
        stickerWidth,
        stickerHeight,
        options,
        encryptionKey,
      );

      stickerCount++;
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(options.outputPath);
      });

      stream.on('error', (error) => {
        reject(new Error(`Failed to write PDF: ${error.message}`));
      });
    });
  }

  /**
   * Generate a single 5x7cm sticker with QR code and EVSE info
   */
  private static async generateSticker(
    doc: any,
    evse: EVSEInfo,
    x: number,
    y: number,
    width: number,
    height: number,
    options: PDFGenerationOptions,
    encryptionKey?: string,
  ): Promise<void> {
    // Draw sticker border (optional, for cutting guides)
    doc
      .save()
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .dash(2, 2)
      .rect(x, y, width, height)
      .stroke()
      .restore();

    const qrData: QRData = {
      evseId: evse.id,
    };

    try {
      let currentY = y + 5; // Start position
      const padding = 5;

      // Optional title at the top
      if (options.stickerTitle) {
        const title = options.stickerTitle;
        let titleFontSize: number;

        // Dynamic font size based on title length
        if (title.length <= 15) {
          titleFontSize = 8;
        } else if (title.length <= 25) {
          titleFontSize = 7;
        } else if (title.length <= 35) {
          titleFontSize = 6;
        } else {
          titleFontSize = 5.5;
        }

        // Split title into lines if needed (max 2 lines)
        const maxCharsPerLine = title.length <= 25 ? 25 : 35;
        const words = title.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (testLine.length <= maxCharsPerLine) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);

        // Limit to 2 lines
        const displayLines = lines.slice(0, 2);

        // Draw title lines
        displayLines.forEach((line) => {
          doc
            .fontSize(titleFontSize)
            .fillColor('#1f2937')
            .font('Helvetica-Bold')
            .text(line, x + padding, currentY, {
              width: width - 2 * padding,
              align: 'center',
              lineBreak: false,
            });
          currentY += titleFontSize + 2;
        });

        currentY += 3; // Extra spacing after title
      }

      // Generate QR code with style config
      const qrBuffer = await QRGenerator.generateQR(qrData, encryptionKey, options.qrStyleConfig);

      // QR code size (approximately 4cm)
      const qrSize = 113; // ~4cm
      const qrX = x + (width - qrSize) / 2;
      const qrY = currentY;

      // QR code already contains the logo (integrated by qr-code-styling)
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // EVSE Name and Code below QR code (on separate lines with dynamic font sizing)
      // Name first (bold), then code (normal)
      let textY = qrY + qrSize + 3; // Spacing between QR and text

      // Display name on first line with dynamic font sizing (bold)
      if (evse.name) {
        let nameFontSize: number;
        let maxNameLength: number;

        // Adjust font size and max length based on name length
        if (evse.name.length <= 18) {
          nameFontSize = 7;
          maxNameLength = 18;
        } else if (evse.name.length <= 28) {
          nameFontSize = 6;
          maxNameLength = 28;
        } else if (evse.name.length <= 40) {
          nameFontSize = 5.5;
          maxNameLength = 40;
        } else {
          nameFontSize = 5;
          maxNameLength = 45;
        }

        const displayName =
          evse.name.length > maxNameLength
            ? evse.name.substring(0, maxNameLength - 3) + '...'
            : evse.name;

        doc
          .fontSize(nameFontSize)
          .fillColor('#1f2937')
          .font('Helvetica-Bold')
          .text(displayName, x + padding, textY, {
            width: width - 2 * padding,
            align: 'center',
            lineBreak: false,
          });
        textY += nameFontSize + 2; // Move to next line (spacing based on font size)
      }

      // Display code on second line with dynamic font sizing (if available)
      if (evse.code) {
        let codeFontSize: number;
        let maxCodeLength: number;

        // Adjust font size and max length based on code length
        if (evse.code.length <= 15) {
          codeFontSize = 7;
          maxCodeLength = 15;
        } else if (evse.code.length <= 25) {
          codeFontSize = 6;
          maxCodeLength = 25;
        } else {
          codeFontSize = 5.5;
          maxCodeLength = 28;
        }

        const displayCode =
          evse.code.length > maxCodeLength
            ? evse.code.substring(0, maxCodeLength - 3) + '...'
            : evse.code;

        doc
          .fontSize(codeFontSize)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(displayCode, x + padding, textY, {
            width: width - 2 * padding,
            align: 'center',
            lineBreak: false,
          });
      } else if (!evse.name) {
        // Fallback: if no name and no code, show ID with dynamic sizing
        let idFontSize: number;
        let maxIdLength: number;

        if (evse.id.length <= 18) {
          idFontSize = 7;
          maxIdLength = 18;
        } else {
          idFontSize = 6;
          maxIdLength = 25;
        }

        const displayId =
          evse.id.length > maxIdLength ? evse.id.substring(0, maxIdLength - 3) + '...' : evse.id;

        doc
          .fontSize(idFontSize)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(displayId, x + padding, textY, {
            width: width - 2 * padding,
            align: 'center',
            lineBreak: false,
          });
      }
    } catch (error) {
      // Fallback: show error message
      doc
        .fontSize(7)
        .fillColor('red')
        .text(
          `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
          x + 5,
          y + height / 2,
          { width: width - 10, align: 'center' },
        );
    }
  }
}
