import { Module } from '@nestjs/common';
import { GeneratorController } from './generator/generator.controller';
import { GeneratorService } from './generator/generator.service';

@Module({
  imports: [],
  controllers: [GeneratorController],
  providers: [GeneratorService],
})
export class AppModule {}