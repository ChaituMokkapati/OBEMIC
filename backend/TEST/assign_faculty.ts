import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const faculty = await prisma.user.findFirst({ where: { role: 'FACULTY' } });
  if (!faculty) { console.log('No faculty found'); return; }
  
  const subject = await prisma.subject.findFirst();
  if (!subject) { console.log('No subject found'); return; }

  const ay = await prisma.academicYear.findFirst();
  if (!ay) { console.log('No AY found'); return; }

  await prisma.facultyAssignment.upsert({
    where: { subjectId_facultyId_academicYearId: { subjectId: subject.id, facultyId: faculty.id, academicYearId: ay.id } },
    update: {},
    create: {
      facultyId: faculty.id,
      subjectId: subject.id,
      academicYearId: ay.id
    }
  });
  console.log('Assigned ' + subject.subjectCode + ' to faculty ' + faculty.employeeId);
}
run().catch(console.error).finally(() => prisma.$disconnect());
