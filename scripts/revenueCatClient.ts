import { createClient } from "@replit/revenuecat-sdk/client";

export async function getUncachableRevenueCatClient() {
  const apiKey = process.env.REVENUECAT_API_KEY;
  if (!apiKey) throw new Error("REVENUECAT_API_KEY environment variable is not set. Connect RevenueCat via the Replit integration first.");
  return createClient({
    baseUrl: "https://api.revenuecat.com/v2",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}
