import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import {
  getStagingDemoPassword,
  hasConfiguredStagingDemoPassword,
  stagingDemoStaffSeeds,
} from "./staging-demo-staff-seeds";

const prisma = new PrismaClient();

async function main() {
  const staffUsers = await Promise.all(
    stagingDemoStaffSeeds.map(async (seed) => {
      const providedPassword = hasConfiguredStagingDemoPassword(seed);

      const staffUser = await prisma.staffUser.upsert({
        where: { username: seed.username },
        update: {
          name: seed.name,
          email: seed.email,
          role: seed.role,
          active: true,
          passwordHash: hashPassword(getStagingDemoPassword(seed)),
        },
        create: {
          name: seed.name,
          username: seed.username,
          email: seed.email,
          role: seed.role,
          active: true,
          passwordHash: hashPassword(getStagingDemoPassword(seed)),
        },
      });

      return {
        username: staffUser.username,
        role: staffUser.role,
        passwordSource: providedPassword ? "staging demo env override" : "default staging demo password",
      };
    }),
  );

  console.log(
    `Bootstrapped ${staffUsers.length} staging demo accounts: ${staffUsers
      .map((staffUser) => `${staffUser.username} (${staffUser.role}, ${staffUser.passwordSource})`)
      .join(", ")}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
