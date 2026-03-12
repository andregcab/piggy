/**
 * One-off script to set a new password for a user (e.g. after forgetting it).
 * Passwords are stored as bcrypt hashes; the original cannot be retrieved.
 *
 * Usage (run from backend directory so DATABASE_URL in .env is used):
 *   npx ts-node -r dotenv/config scripts/reset-password.ts <username> <newPassword>
 *
 * Example:
 *   npx ts-node -r dotenv/config scripts/reset-password.ts "cabrerandre@gmail.com" "Nikoncheese415"
 *
 * If login still fails after success here, the app may be using a different
 * DATABASE_URL—check that the app and this script use the same .env.
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [, , username, newPassword] = process.argv;
  if (!username || !newPassword) {
    console.error(
      'Usage: npx ts-node -r dotenv/config scripts/reset-password.ts <username> <newPassword>',
    );
    process.exit(1);
  }

  // Log which DB we're using (redacted) so you can confirm it matches the running app
  const dbHint = connectionString!.replace(/:[^:@]+@/, ':****@');
  console.log('Using DATABASE_URL:', dbHint);

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.error(`User "${username}" not found.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Verify the stored hash so we know the password was set correctly
  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  const verified =
    updated && (await bcrypt.compare(newPassword, updated.passwordHash));

  console.log(
    `Password updated for user "${username}". You can log in with the new password.`,
  );
  if (!verified) {
    console.error(
      'Warning: verification failed (new password did not match stored hash).',
    );
    process.exit(1);
  }
  console.log('Verified: stored hash matches the new password.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
