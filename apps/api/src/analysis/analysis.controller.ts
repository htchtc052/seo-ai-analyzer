import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import {
  analysisRequestSchema,
  analysisRunListSchema,
  analysisRunResponseSchema,
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

  @Get(':id')
  @ResponseSchema(analysisRunResponseSchema)
  async findById(@Param('id') id: string) {
    return { run: await this.analysis.findById(id) };
  }
}
