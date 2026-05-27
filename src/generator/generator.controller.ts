// src/generator/generator.controller.ts
import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import type { FastifyReply } from 'fastify';

@Controller('generate')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Get('image')
  async downloadImage(
    @Query('type') type: 'qr' | 'barcode',
    @Query('data') data: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<StreamableFile> {
    const { buffer, mimeType } = await this.generatorService.generateImage(type, data);
    const extension = mimeType.split('/')[1];

    res.headers({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="generated-code.${extension}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('pdf')
  async downloadPdf(
    @Query('type') type: 'qr' | 'barcode',
    @Query('data') data: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.generatorService.generatePdf(type, data);

    res.headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="generated-code.pdf"',
    });

    return new StreamableFile(pdfBuffer);
  }
}