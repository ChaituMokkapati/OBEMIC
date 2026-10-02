import { prisma } from './backend/src/database/index';

async function run() {
  try {
    const user = await prisma.user.findFirst({ where: { employeeId: '2082' } });
    console.log('USER EMAIL:', user?.email);
  } catch(e) {
    console.error(e);
  }
}
run();
