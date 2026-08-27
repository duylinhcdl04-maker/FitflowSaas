const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT column_name, is_generated, generation_expression, column_default
    FROM information_schema.columns 
    WHERE table_name = 'customer_pt_packages';
  `;
  console.log(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
