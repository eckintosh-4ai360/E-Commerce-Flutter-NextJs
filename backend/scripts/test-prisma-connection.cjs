const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('connected');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
