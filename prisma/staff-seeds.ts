export type StaffSeed = {
  name: string;
  username: string;
  email: string;
  role: "MANAGER" | "SALES_MANAGER";
  passwordEnvKey: "SEED_MANAGER_PASSWORD" | "SEED_SALES_MANAGER_PASSWORD";
  defaultPassword: string;
};

export const staffSeeds: StaffSeed[] = [
  {
    name: "Daniel Jorge",
    username: "daniel",
    email: "daniel.jorge@tara.local",
    role: "MANAGER",
    passwordEnvKey: "SEED_MANAGER_PASSWORD",
    defaultPassword: "DanielTARA!2026",
  },
  {
    name: "Shireen Radley",
    username: "shireen",
    email: "shireen.radley@tara.local",
    role: "SALES_MANAGER",
    passwordEnvKey: "SEED_SALES_MANAGER_PASSWORD",
    defaultPassword: "ShireenTARA!2026",
  },
];

export function getBootstrapPassword(seed: StaffSeed) {
  return process.env[seed.passwordEnvKey] ?? seed.defaultPassword;
}

export function hasConfiguredBootstrapPassword(seed: StaffSeed) {
  return Boolean(process.env[seed.passwordEnvKey]);
}
