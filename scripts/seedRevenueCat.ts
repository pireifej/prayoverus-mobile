import { getUncachableRevenueCatClient } from "./revenueCatClient";

import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "PrayOverUs";

// Two separate one-time purchases
const PRODUCTS = [
  {
    identifier: "extended_prayer_unlock",
    playStoreIdentifier: "extended_prayer_unlock:lifetime",
    displayName: "Extended AI Prayer",
    userFacingTitle: "Extended AI Prayer",
    duration: "P1Y" as const, // yearly = effectively lifetime for one-time
    entitlementKey: "extended_prayer",
    entitlementName: "Extended AI Prayer Access",
    offeringKey: "extended_prayer_offering",
    offeringName: "Extended Prayer Offering",
    packageKey: "$rc_annual",
    packageName: "Extended Prayer Unlock",
    price: { amount_micros: 2990000, currency: "USD" }, // $2.99
  },
  {
    identifier: "premium_themes_unlock",
    playStoreIdentifier: "premium_themes_unlock:lifetime",
    displayName: "Premium Prayer Themes",
    userFacingTitle: "Premium Prayer Themes",
    duration: "P1Y" as const,
    entitlementKey: "premium_themes",
    entitlementName: "Premium Themes Access",
    offeringKey: "premium_themes_offering",
    offeringName: "Premium Themes Offering",
    packageKey: "$rc_annual",
    packageName: "Premium Themes Unlock",
    price: { amount_micros: 1990000, currency: "USD" }, // $1.99
  },
];

const APP_STORE_APP_NAME = "PrayOverUs iOS";
const APP_STORE_BUNDLE_ID = "com.pireifej.prayoverus";
const PLAY_STORE_APP_NAME = "PrayOverUs Android";
const PLAY_STORE_PACKAGE_NAME = "com.pireifej.prayoverus";

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // ─── Project ───────────────────────────────────────────────────────────────
  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });
  if (listProjectsError) throw new Error("Failed to list projects");

  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);
  if (existingProject) {
    console.log("Project already exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error } = await createProject({ client, body: { name: PROJECT_NAME } });
    if (error) throw new Error("Failed to create project");
    console.log("Created project:", newProject.id);
    project = newProject;
  }

  // ─── Apps ──────────────────────────────────────────────────────────────────
  const { data: apps, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listAppsError || !apps || apps.items.length === 0) throw new Error("No apps found");

  let testStoreApp: App | undefined = apps.items.find((a) => a.type === "test_store");
  let appStoreApp: App | undefined = apps.items.find((a) => a.type === "app_store");
  let playStoreApp: App | undefined = apps.items.find((a) => a.type === "play_store");

  if (!testStoreApp) throw new Error("No test store app found");
  console.log("Test store app:", testStoreApp.id);

  if (!appStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("Failed to create App Store app");
    appStoreApp = newApp;
    console.log("Created App Store app:", appStoreApp.id);
  } else {
    console.log("App Store app found:", appStoreApp.id);
  }

  if (!playStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("Failed to create Play Store app");
    playStoreApp = newApp;
    console.log("Created Play Store app:", playStoreApp.id);
  } else {
    console.log("Play Store app found:", playStoreApp.id);
  }

  // ─── Products, Entitlements & Offerings (one per purchase) ────────────────
  const { data: existingProducts, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (listProductsError) throw new Error("Failed to list products");

  const ensureProduct = async (targetApp: App, label: string, storeIdentifier: string, isTest: boolean, productDef: typeof PRODUCTS[0]): Promise<Product> => {
    const existing = existingProducts.items?.find((p) => p.store_identifier === storeIdentifier && p.app_id === targetApp.id);
    if (existing) { console.log(`${label} product exists:`, existing.id); return existing; }

    const body: CreateProductData["body"] = {
      store_identifier: storeIdentifier,
      app_id: targetApp.id,
      type: "subscription",
      display_name: productDef.displayName,
    };
    if (isTest) {
      body.subscription = { duration: productDef.duration };
      body.title = productDef.userFacingTitle;
    }
    const { data, error } = await createProduct({ client, path: { project_id: project.id }, body });
    if (error) throw new Error(`Failed to create ${label} product`);
    console.log(`Created ${label} product:`, data.id);
    return data;
  };

  for (const productDef of PRODUCTS) {
    console.log(`\n── Setting up: ${productDef.displayName} ──`);

    const testProduct = await ensureProduct(testStoreApp, "Test Store", productDef.identifier, true, productDef);
    const iosProduct = await ensureProduct(appStoreApp, "App Store", productDef.identifier, false, productDef);
    const androidProduct = await ensureProduct(playStoreApp, "Play Store", productDef.playStoreIdentifier, false, productDef);

    // Add test store price
    const { error: priceError } = await client.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProduct.id },
      body: { prices: [productDef.price] },
    });
    if (priceError) {
      if (typeof priceError === "object" && "type" in priceError && priceError["type"] === "resource_already_exists") {
        console.log("Test store price already set");
      } else {
        throw new Error("Failed to add test store price");
      }
    } else {
      console.log(`Test store price set: $${productDef.price.amount_micros / 1000000}`);
    }

    // Entitlement
    const { data: existingEntitlements, error: listEntitlementsError } = await listEntitlements({
      client, path: { project_id: project.id }, query: { limit: 20 },
    });
    if (listEntitlementsError) throw new Error("Failed to list entitlements");

    let entitlement: Entitlement | undefined = existingEntitlements.items?.find((e) => e.lookup_key === productDef.entitlementKey);
    if (!entitlement) {
      const { data, error } = await createEntitlement({
        client, path: { project_id: project.id },
        body: { lookup_key: productDef.entitlementKey, display_name: productDef.entitlementName },
      });
      if (error) throw new Error("Failed to create entitlement");
      entitlement = data;
      console.log("Created entitlement:", entitlement.id);
    } else {
      console.log("Entitlement exists:", entitlement.id);
    }

    const { error: attachErr } = await attachProductsToEntitlement({
      client,
      path: { project_id: project.id, entitlement_id: entitlement.id },
      body: { product_ids: [testProduct.id, iosProduct.id, androidProduct.id] },
    });
    if (attachErr && (attachErr as any).type !== "unprocessable_entity_error") throw new Error("Failed to attach products to entitlement");

    // Offering
    const { data: existingOfferings, error: listOfferingsError } = await listOfferings({
      client, path: { project_id: project.id }, query: { limit: 20 },
    });
    if (listOfferingsError) throw new Error("Failed to list offerings");

    let offering: Offering | undefined = existingOfferings.items?.find((o) => o.lookup_key === productDef.offeringKey);
    if (!offering) {
      const { data, error } = await createOffering({
        client, path: { project_id: project.id },
        body: { lookup_key: productDef.offeringKey, display_name: productDef.offeringName },
      });
      if (error) throw new Error("Failed to create offering");
      offering = data;
      console.log("Created offering:", offering.id);
    } else {
      console.log("Offering exists:", offering.id);
    }

    // Package
    const { data: existingPkgs, error: listPkgErr } = await listPackages({
      client, path: { project_id: project.id, offering_id: offering.id }, query: { limit: 20 },
    });
    if (listPkgErr) throw new Error("Failed to list packages");

    let pkg: Package | undefined = existingPkgs.items?.find((p) => p.lookup_key === productDef.packageKey);
    if (!pkg) {
      const { data, error } = await createPackages({
        client, path: { project_id: project.id, offering_id: offering.id },
        body: { lookup_key: productDef.packageKey, display_name: productDef.packageName },
      });
      if (error) throw new Error("Failed to create package");
      pkg = data;
      console.log("Created package:", pkg.id);
    } else {
      console.log("Package exists:", pkg.id);
    }

    const { error: attachPkgErr } = await attachProductsToPackage({
      client, path: { project_id: project.id, package_id: pkg.id },
      body: {
        products: [
          { product_id: testProduct.id, eligibility_criteria: "all" },
          { product_id: iosProduct.id, eligibility_criteria: "all" },
          { product_id: androidProduct.id, eligibility_criteria: "all" },
        ],
      },
    });
    if (attachPkgErr && !(attachPkgErr as any).message?.includes("Cannot attach product")) {
      throw new Error("Failed to attach products to package");
    }
  }

  // ─── Print all API keys ───────────────────────────────────────────────────
  const { data: testKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: testStoreApp.id } });
  const { data: iosKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: appStoreApp.id } });
  const { data: androidKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: playStoreApp.id } });

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║          RevenueCat Setup Complete! 🎉           ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("Project ID:          ", project.id);
  console.log("Test Store App ID:   ", testStoreApp.id);
  console.log("App Store App ID:    ", appStoreApp.id);
  console.log("Play Store App ID:   ", playStoreApp.id);
  console.log("\nEntitlements:");
  console.log("  Extended Prayer:   ", PRODUCTS[0].entitlementKey);
  console.log("  Premium Themes:    ", PRODUCTS[1].entitlementKey);
  console.log("\nPublic API Keys:");
  console.log("  Test Store:        ", testKeys?.items[0]?.key ?? "N/A");
  console.log("  App Store (iOS):   ", iosKeys?.items[0]?.key ?? "N/A");
  console.log("  Play Store (Android):", androidKeys?.items[0]?.key ?? "N/A");
  console.log("\n→ Save these as environment variables:");
  console.log("  REVENUECAT_PROJECT_ID =", project.id);
  console.log("  REVENUECAT_TEST_STORE_APP_ID =", testStoreApp.id);
  console.log("  REVENUECAT_APPLE_APP_STORE_APP_ID =", appStoreApp.id);
  console.log("  REVENUECAT_GOOGLE_PLAY_STORE_APP_ID =", playStoreApp.id);
  console.log("  EXPO_PUBLIC_REVENUECAT_TEST_API_KEY =", testKeys?.items[0]?.key ?? "N/A");
  console.log("  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY =", iosKeys?.items[0]?.key ?? "N/A");
  console.log("  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY =", androidKeys?.items[0]?.key ?? "N/A");
}

seedRevenueCat().catch(console.error);
