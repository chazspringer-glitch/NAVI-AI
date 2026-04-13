import { NextRequest, NextResponse } from "next/server";
import { redeemAccessCode } from "@/lib/accessCodes";

export async function POST(req: NextRequest) {
  try {
    const { code, user_id } = await req.json();

    if (!code || !user_id) {
      return NextResponse.json(
        { success: false, error: "Code and user_id are required" },
        { status: 400 },
      );
    }

    const result = await redeemAccessCode(code, user_id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error("[api/redeem-code] error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}
