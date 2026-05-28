// src/generator/generator.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';

@Injectable()
export class GeneratorService {

  // Generates raw code images as a Buffer
  async generateImage(type: 'qr' | 'barcode', data: string): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!data) throw new BadRequestException('Data string is required');

    try {
      if (type === 'qr') {
        // Handle variations in how the bundler exports the QRCode library on the edge
        const qrModule = (QRCode as any).default || QRCode;
        const toBufferFn = qrModule.toBuffer || (QRCode as any).toBuffer;

        if (typeof toBufferFn !== 'function') {
          throw new Error('QRCode.toBuffer method could not be resolved in this runtime context');
        }

        const qrBuffer = await toBufferFn(data, { type: 'png', margin: 2, width: 400 });
        return { buffer: qrBuffer as Buffer, mimeType: 'image/png' };
      } else {
        // Handle variations in how the bundler exports the bwipjs library on the edge
        const bwipModule = (bwipjs as any).default || bwipjs;
        const toBufferFn = bwipModule.toBuffer || (bwipjs as any).toBuffer;

        if (typeof toBufferFn !== 'function') {
          throw new Error('bwipjs.toBuffer method could not be resolved in this runtime context');
        }

        const barcodeBuffer = await toBufferFn({
          bcid: 'code128',
          text: data,
          scale: 3,
          height: 15,
          includetext: true,
          textxalign: 'center',
        });
        return { buffer: barcodeBuffer, mimeType: 'image/png' };
      }
    } catch (error: any) {
      throw new BadRequestException(`Failed to generate ${type}: ${error.message}`);
    }
  }

  // Generates a structured PDF layout containing the asset
  async generatePdf(type: 'qr' | 'barcode', data: string): Promise<Buffer> {
    const { buffer: imgBuffer } = await this.generateImage(type, data);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: any[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Build Document Title Header
      doc.fontSize(20).text(`Generated ${type.toUpperCase()} Code`, { align: 'center' });
      doc.moveDown(2);
      
      // Center the asset image within the layout grid
      doc.image(imgBuffer, {
        fit: type === 'qr' ? [250, 250] : [350, 150],
        align: 'center',
        valign: 'center'
      });
      
      doc.moveDown(2);
      doc.fontSize(10).fillColor('gray').text(`Raw Value: ${data}`, { align: 'center' });

      doc.end();
    });
  }
}