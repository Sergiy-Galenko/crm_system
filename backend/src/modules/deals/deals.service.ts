import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { clientAccessWhere, dealAccessWhere, leadAccessWhere, visibleUsersWhere } from "@backend/common/scope/crm-scope";
import { UpsertDealDto } from "./dto/upsert-deal.dto";
import { PromoCodesService } from "@backend/modules/promo-codes/promo-codes.service";

function normalizedPromoCode(value: string | undefined) {
  return value?.trim().toUpperCase() || "";
}

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly promoCodesService: PromoCodesService,
  ) {}

  async upsertDeal(user: RequestUser, dto: UpsertDealDto) {
    const owner = await this.prisma.user.findFirst({
      where: {
        id: dto.ownerId,
        ...visibleUsersWhere(user),
      },
      select: { id: true },
    });

    if (!owner) {
      throw new BadRequestException("That owner is not in your team.");
    }

    const client = await this.prisma.client.findFirst({
      where: {
        id: dto.clientId,
        ...clientAccessWhere(user),
      },
      select: { id: true },
    });

    if (!client) {
      throw new BadRequestException("That client is not available in your workspace.");
    }

    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: {
          id: dto.leadId,
          ...leadAccessWhere(user),
        },
        select: { id: true },
      });

      if (!lead) {
        throw new BadRequestException("That lead is not available in your workspace.");
      }
    }

    if (dto.id) {
      const existingDeal = await this.prisma.deal.findFirst({
        where: {
          id: dto.id,
          ...dealAccessWhere(user),
        },
        select: { id: true },
      });

      if (!existingDeal) {
        throw new ForbiddenException("You can only update deals in your workspace.");
      }
    }

    const promoCodeInput = normalizedPromoCode(dto.promoCode);

    await this.prisma.$transaction(async (tx) => {
      const existingDeal = dto.id
        ? await tx.deal.findUnique({
            where: { id: dto.id },
            include: {
              promoUsage: true,
              promoCode: true,
            },
          })
        : null;

      let discountAmount = 0;
      let netAmount = dto.grossAmount;
      let promoCodeId: string | null = null;

      const currentPromoCode = existingDeal?.promoCode?.code ?? "";
      const isSamePromoCode = Boolean(existingDeal?.promoUsage && currentPromoCode && currentPromoCode === promoCodeInput);

      if (existingDeal?.promoUsage && !isSamePromoCode) {
        await tx.promoCodeUsage.delete({
          where: { dealId: existingDeal.id },
        });

        await tx.promoCode.update({
          where: { id: existingDeal.promoUsage.promoCodeId },
          data: {
            usedCount: {
              decrement: 1,
            },
          },
        });
      }

      if (promoCodeInput && isSamePromoCode && existingDeal?.promoUsage && existingDeal.promoCodeId) {
        const recalculated = this.promoCodesService.recalculateAppliedPromo(dto.grossAmount, existingDeal.promoUsage);
        discountAmount = recalculated.discountAmount;
        netAmount = recalculated.finalAmount;
        promoCodeId = existingDeal.promoCodeId;

        await tx.promoCodeUsage.update({
          where: { dealId: existingDeal.id },
          data: {
            dealAmount: dto.grossAmount,
            discountAmount,
            clientId: dto.clientId,
          },
        });
      } else if (promoCodeInput) {
        const promoValidation = await this.promoCodesService.validatePromoCode(
          promoCodeInput,
          dto.grossAmount,
          { id: user.userId, role: user.role },
          tx,
        );

        if (!promoValidation.valid) {
          throw new BadRequestException(promoValidation.message);
        }

        discountAmount = promoValidation.discountAmount;
        netAmount = promoValidation.finalAmount;
        promoCodeId = promoValidation.promoCode.id;
      }

      const deal = existingDeal
        ? await tx.deal.update({
            where: { id: existingDeal.id },
            data: {
              title: dto.title,
              description: dto.description || null,
              stage: dto.stage,
              currency: dto.currency,
              grossAmount: dto.grossAmount,
              discountAmount,
              netAmount,
              closeDate: dto.closeDate,
              clientId: dto.clientId,
              leadId: dto.leadId || null,
              ownerId: dto.ownerId,
              promoCodeId,
            },
          })
        : await tx.deal.create({
            data: {
              title: dto.title,
              description: dto.description || null,
              stage: dto.stage,
              currency: dto.currency,
              grossAmount: dto.grossAmount,
              discountAmount,
              netAmount,
              closeDate: dto.closeDate,
              clientId: dto.clientId,
              leadId: dto.leadId || null,
              ownerId: dto.ownerId,
              promoCodeId,
            },
          });

      if (promoCodeInput && !isSamePromoCode) {
        const promoCode = await tx.promoCode.findUniqueOrThrow({
          where: { code: promoCodeInput },
        });

        await tx.promoCode.update({
          where: { id: promoCode.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });

        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: promoCode.id,
            dealId: deal.id,
            clientId: dto.clientId,
            appliedById: user.userId,
            dealAmount: dto.grossAmount,
            discountAmount,
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue,
          },
        });

        await this.activityLogService.log(tx, {
          actorId: user.userId,
          entity: ActivityEntity.DEAL,
          action: ActivityAction.PROMO_APPLIED,
          entityId: deal.id,
          description: `Applied ${promoCode.code} to ${deal.title}.`,
        });
      }

      await this.activityLogService.log(tx, {
        actorId: user.userId,
        entity: ActivityEntity.DEAL,
        action: existingDeal ? ActivityAction.UPDATED : ActivityAction.CREATED,
        entityId: deal.id,
        description: existingDeal ? `Updated deal ${deal.title}.` : `Created deal ${deal.title}.`,
      });

      const affectedClientIds = new Set<string>([dto.clientId]);

      if (existingDeal?.clientId && existingDeal.clientId !== dto.clientId) {
        affectedClientIds.add(existingDeal.clientId);
      }

      for (const clientId of affectedClientIds) {
        const wonRevenue = await tx.deal.aggregate({
          where: {
            clientId,
            stage: "WON",
          },
          _sum: {
            netAmount: true,
          },
        });

        await tx.client.update({
          where: { id: clientId },
          data: {
            lastContactAt: clientId === dto.clientId ? new Date() : undefined,
            totalRevenue: wonRevenue._sum.netAmount ?? 0,
          },
        });
      }
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

}
