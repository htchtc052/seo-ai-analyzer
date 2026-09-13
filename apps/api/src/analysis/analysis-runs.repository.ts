import { Inject, Injectable } from '@nestjs/common';
import type { AnalysisRequest, Recommendation } from '@semantic/contracts';
import { PrismaService } from '../prisma/prisma.service.js';

const articleRef = { select: { id: true, sourceUrl: true, title: true } };

@Injectable()
export class AnalysisRunsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create({ competitorIds, ...input }: AnalysisRequest, scores: number[]) {
    return this.prisma.analysisRun.create({
      data: { ...input, scores, competitors: { connect: competitorIds.map((id) => ({ id })) } },
    });
  }

  findById(id: string) {
    return this.prisma.analysisRun.findUnique({
      where: { id },
      include: { article: true, competitors: true },
    });
  }

  findRecent() {
    return this.prisma.analysisRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { article: articleRef, _count: { select: { competitors: true } } },
    });
  }

  saveRecommendation(id: string, recommendation: Recommendation) {
    return this.prisma.analysisRun.update({ where: { id }, data: recommendation });
  }
}
