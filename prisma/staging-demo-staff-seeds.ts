export type StagingDemoStaffSeed = {
  name: string;
  username: string;
  email: string;
  role: "MANAGER" | "SALES_MANAGER" | "CASHIER";
  passwordEnvKey: string;
  defaultPassword: string;
};

const DEFAULT_STAGING_DEMO_PASSWORD = "TARADEMO2026";

export const stagingDemoStaffSeeds: StagingDemoStaffSeed[] = [
  {
    name: "TARA Demo Manager",
    username: "demo-manager",
    email: "demo.manager@tara.local",
    role: "MANAGER",
    passwordEnvKey: "STAGING_DEMO_MANAGER_PASSWORD",
    defaultPassword: DEFAULT_STAGING_DEMO_PASSWORD,
  },
  {
    name: "TARA Demo Sales",
    username: "demo-sales",
    email: "demo.sales@tara.local",
    role: "SALES_MANAGER",
    passwordEnvKey: "STAGING_DEMO_SALES_PASSWORD",
    defaultPassword: DEFAULT_STAGING_DEMO_PASSWORD,
  },
  {
    name: "TARA Demo Cashier",
    username: "demo-cashier",
    email: "demo.cashier@tara.local",
    role: "CASHIER",
    passwordEnvKey: "STAGING_DEMO_CASHIER_PASSWORD",
    defaultPassword: DEFAULT_STAGING_DEMO_PASSWORD,
  },
];

export function getStagingDemoPassword(seed: StagingDemoStaffSeed) {
  return (
    process.env[seed.passwordEnvKey] ??
    process.env.STAGING_DEMO_PASSWORD ??
    seed.defaultPassword
  );
}

export function hasConfiguredStagingDemoPassword(seed: StagingDemoStaffSeed) {
  return Boolean(process.env[seed.passwordEnvKey] || process.env.STAGING_DEMO_PASSWORD);
}
