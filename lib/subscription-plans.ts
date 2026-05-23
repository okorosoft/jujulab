export const PLANS = {
  free: {
    name: "Free",
    monthlyCredits: 30,
    toolAccess: [],
  },
  pro: {
    name: "Pro",
    monthlyCredits: 1000,
    toolAccess: "all",
  },
  elite: {
    name: "Elite",
    monthlyCredits: 3500,
    toolAccess: "all",
  },
} as const;

export type PlanName = keyof typeof PLANS;