import { getStagingDemoPassword, stagingDemoStaffSeeds } from "@/prisma/staging-demo-staff-seeds";

export function getAppEnvironmentLabel() {
  return process.env.NEXT_PUBLIC_APP_ENV_LABEL?.trim() || null;
}

export function isStagingDemoEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_STAGING_DEMO === "true";
}

export function getStagingDemoCredentials() {
  if (!isStagingDemoEnabled()) {
    return [];
  }

  return stagingDemoStaffSeeds.map((seed) => ({
    name: seed.name,
    username: seed.username,
    role: seed.role,
    password: getStagingDemoPassword(seed),
  }));
}
