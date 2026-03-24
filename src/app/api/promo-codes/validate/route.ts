import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { promoCodePreviewSchema } from "@/lib/validations";
import { validatePromoCode } from "@/lib/promo-codes";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const payload = await request.json();
  const parsedPayload = promoCodePreviewSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        message: parsedPayload.error.errors[0]?.message ?? "Invalid payload.",
      },
      { status: 400 },
    );
  }

  const validation = await validatePromoCode(parsedPayload.data.code, parsedPayload.data.amount);

  if (!validation.valid) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        message: validation.message,
      },
      { status: 200 },
    );
  }

  return NextResponse.json<ApiResponse<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    type: string;
    value: number;
  }>>({
    success: true,
    message: `${validation.promoCode.code} is valid and ready to apply.`,
    data: {
      code: validation.promoCode.code,
      discountAmount: validation.discountAmount,
      finalAmount: validation.finalAmount,
      type: validation.promoCode.discountType,
      value:
        typeof validation.promoCode.discountValue === "number"
          ? validation.promoCode.discountValue
          : validation.promoCode.discountValue.toNumber(),
    },
  });
}
