import { getUserPlan } from "@/lib/get-user-plan";

export default async function AccountPage() {
  const planData = await getUserPlan();

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-6">Account Overview</h1>

        {!planData ? (
          <p>Not signed in</p>
        ) : (
          <div className="space-y-4 text-lg">
            <p>Plan: {planData.plan}</p>
            <p>Monthly Credits: {planData.monthlyCredits}</p>
            <p>Credits Remaining: {planData.creditsRemaining}</p>
            <p>
              Tool Access:{" "}
              {Array.isArray(planData.toolAccess)
                ? planData.toolAccess.join(", ")
                : planData.toolAccess}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}