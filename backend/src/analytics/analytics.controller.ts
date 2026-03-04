import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService, type TrendsPointDto } from './analytics.service';
import { GetMonthlyQueryDto } from './dto/get-monthly-query.dto';
import { GetTrendsQueryDto } from './dto/get-trends-query.dto';

import type { UserPayload } from '../auth/types/user-payload';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('monthly')
  async monthly(
    @CurrentUser() user: UserPayload,
    @Query() query: GetMonthlyQueryDto,
  ) {
    const now = new Date();
    const y = query.year ?? now.getFullYear();
    const m = query.month ?? now.getMonth() + 1;
    return await this.analyticsService.getMonthlySummary(user.id, y, m);
  }

  @Get('trends')
  async trends(
    @CurrentUser() user: UserPayload,
    @Query() query: GetTrendsQueryDto,
  ): Promise<TrendsPointDto[]> {
    const now = new Date();
    const y = query.year ?? now.getFullYear();
    const m = query.month ?? now.getMonth() + 1;
    const months = query.months ?? 12;
    const service: AnalyticsService = this.analyticsService;
    const points: TrendsPointDto[] = await service.getTrends(
      user.id,
      y,
      m,
      months,
    );
    return points;
  }
}
