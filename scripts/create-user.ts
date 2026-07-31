import { config } from "dotenv";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

config();

const prisma = new PrismaClient();

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/create-user.ts <email> <password> [name]",
    );
    process.exit(1);
  }

  const normalized = email.toLowerCase();
  const passwordHash = await hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: normalized },
    update: { passwordHash, name: name || undefined },
    create: {
      email: normalized,
      passwordHash,
      name: name || normalized.split("@")[0],
      plan: "pro",
    },
    select: { id: true, email: true, name: true, plan: true },
  });

  console.log("User ready:", user);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
