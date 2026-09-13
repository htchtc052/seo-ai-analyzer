import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import {
  analysisRequestSchema,
  analysisRunListSchema,
  analysisRunResponseSchema,
  featuresResponseSchema,
  type AnalysisRequest,
} from '@semantic/contracts';
import { ResponseSchema } from '../common/response-schema.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AnalysisService } from './analysis.service.js';

@Controller('analyses')
export class AnalysisController {
  constructor(
    @Inject(AnalysisService)
    private readonly analysis: AnalysisService,
  ) {}

  @Post()
  @ResponseSchema(analysisRunResponseSchema)
  async start(
    @Body(new ZodValidationPipe(analysisRequestSchema)) input: AnalysisRequest,
  ) {
    return { run: await this.analysis.start(input) };
  }

  @Get()
  @ResponseSchema(analysisRunListSchema)
  async findRecent() {
    return { runs: await this.analysis.findRecent() };
  }

  @Get('features')
  @ResponseSchema(featuresResponseSchema)
  features() {
    return { features: this.analysis.features() };
  }

  @Get(':id')
  @ResponseSchema(analysisRunResponseSchema)
  async findById(@Param('id') id: string) {
    return { run: await this.analysis.findById(id) };
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    await this.analysis.delete(id);
  }
}
