import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/get-user-plan";

export async function GET() {
  try {
    const planData = await getUserPlan();

    if (!planData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(planData);
  } catch (error) {
    console.error("Plan status error:", error);
    return NextResponse.json(
      { error: "Failed to get plan status" },
      { status: 500 }
    );
  }
}