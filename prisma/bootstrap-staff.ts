import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import {
  getBootstrapPassword,
  hasConfiguredBootstrapPassword,
  staffSeeds,
} from "./staff-seeds";

const prisma = new PrismaClient();

async function main() {
  const staffUsers = await Promise.all(
    staffSeeds.map(async (seed) => {
      const providedPassword = hasConfiguredBootstrapPassword(seed);

      const staffUser = await prisma.staffUser.upsert({
        where: { username: seed.username },
        update: {
          name: seed.name,
          email: seed.email,
          role: seed.role,
          active: true,
          ...(providedPassword
            ? { passwordHash: hashPassword(getBootstrapPassword(seed)) }
            : {}),
        },
        create: {
          name: seed.name,
          username: seed.username,
          email: seed.email,
          role: seed.role,
          active: true,
          passwordHash: hashPassword(getBootstrapPassword(seed)),
        },
      });

      return {
        username: staffUser.username,
        role: staffUser.role,
        passwordSource: providedPassword ? seed.passwordEnvKey : "default bootstrap password",
      };
    }),
  );

  console.log(
    `Bootstrapped ${staffUsers.length} staff accounts: ${staffUsers
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
