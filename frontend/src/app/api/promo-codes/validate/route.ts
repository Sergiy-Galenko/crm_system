import { NextResponse } from "next/server";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { PromoCodesService } from "@backend/modules/promo-codes/promo-codes.service";
import { ValidatePromoCodeDto } from "@backend/modules/promo-codes/dto/validate-promo-code.dto";
import { getServerTranslator } from "@/lib/locale-server";
import { getCurrentUser } from "@/lib/session";
import { actionErrorFromException } from "@/lib/backend-actions";
import { decimalToNumber } from "@/lib/utils";

export async function POST(request: Request) {
  const { t } = await getServerTranslator();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: t("Unauthorized."),
      },
      { status: 401 },
    );
  }

  try {
    const payload = await request.json();
    const dto = await validateDto(ValidatePromoCodeDto, payload);
    const promoCodesService = await resolveProvider(PromoCodesService);
    const result = await promoCodesService.validatePromoCode(dto.code, dto.amount, {
      id: user.id,
      role: user.role,
    });

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        message: t(result.message),
      });
    }

    return NextResponse.json({
      success: true,
      message: t("{code} is valid and ready to apply.", { code: result.promoCode.code }),
      data: {
        code: result.promoCode.code,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        type: result.promoCode.discountType,
        value: decimalToNumber(result.promoCode.discountValue),
      },
    });
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      code: ["promo code"],
      amount: ["amount"],
    });

    return NextResponse.json({
      success: false,
      message: response.message,
      fields: response.fields,
    }, { status: 400 });
  }
}
