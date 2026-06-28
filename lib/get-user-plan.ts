import { auth, clerkClient } from "@clerk/nextjs/server";
import { PLANS, PlanName } from "./subscription-plans";
import { shouldResetCredits } from "./reset-credits";

type ToolAccess = string[] | "all" | "core";

export type UserPlanData = {
  plan: PlanName;
  monthlyCredits: number;
  creditsRemaining: number;
  toolAccess: ToolAccess;
  lastReset?: string;
};

export async function getUserPlan(): Promise<UserPlanData | null> {
  const { userId } = await auth();

  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const publicMetadata = user.publicMetadata as Record<string, any>;

  const rawPlan = publicMetadata.plan as PlanName | undefined;
  const plan: PlanName = rawPlan && PLANS[rawPlan] ? rawPlan : "free";

  const defaultPlan = PLANS[plan];

  let monthlyCredits =
    typeof publicMetadata.monthlyCredits === "number"
      ? publicMetadata.monthlyCredits
      : defaultPlan.monthlyCredits;

  let creditsRemaining =
    typeof publicMetadata.creditsRemaining === "number"
      ? publicMetadata.creditsRemaining
      : defaultPlan.monthlyCredits;

  let toolAccess: ToolAccess =
  publicMetadata.toolAccess === "all" || publicMetadata.toolAccess === "core"
    ? publicMetadata.toolAccess
    : Array.isArray(publicMetadata.toolAccess)
      ? [...publicMetadata.toolAccess]
      : Array.isArray(defaultPlan.toolAccess)
        ? [...defaultPlan.toolAccess]
        : defaultPlan.toolAccess;

  const lastReset =
    typeof publicMetadata.lastReset === "string"
      ? publicMetadata.lastReset
      : undefined;

  if (shouldResetCredits(lastReset)) {
    creditsRemaining = monthlyCredits;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...publicMetadata,
        creditsRemaining,
        monthlyCredits,
        plan,
        toolAccess,
        lastReset: new Date().toISOString(),
      },
    });
  }

  return {
    plan,
    monthlyCredits,
    creditsRemaining,
    toolAccess,
    lastReset,
  };
}