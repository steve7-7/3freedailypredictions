import { getCurrentUser, isPremiumActive } from "@/lib/auth";
import { isDemoUser } from "@/lib/demo";
import { isSupabaseEnabled } from "@/lib/supabase";
import { hoursLeft, PREMIUM_HOURS, PREMIUM_PRICE, PREMIUM_CURRENCY } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
      premiumUntil: user.premiumUntil,
      premiumActive: isPremiumActive(user),
      premiumHoursLeft: hoursLeft(user.premiumUntil),
      isDemo: isDemoUser(user),
      authProvider: isDemoUser(user)
        ? "demo"
        : isSupabaseEnabled()
          ? "supabase"
          : "local",
      price: PREMIUM_PRICE,
      currency: PREMIUM_CURRENCY,
      passHours: PREMIUM_HOURS,
    },
  });
}
