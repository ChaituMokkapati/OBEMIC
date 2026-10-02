import { PrismaClient, RoleName, UserStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = [RoleName.FACULTY, RoleName.ADMIN, RoleName.COORDINATOR, RoleName.MANAGEMENT];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }
  const adminRole = await prisma.role.findUnique({ where: { roleName: RoleName.ADMIN } });
  const facultyRole = await prisma.role.findUnique({ where: { roleName: RoleName.FACULTY } });

  // 2. Departments
  const deptCSE = await prisma.department.upsert({
    where: { departmentName: 'CSE' },
    update: {},
    create: { departmentName: 'CSE' },
  });
  
  const deptIT = await prisma.department.upsert({
    where: { departmentName: 'IT' },
    update: {},
    create: { departmentName: 'IT' },
  });

  // 3. Academic Year & Semester
  const academicYear = await prisma.academicYear.upsert({
    where: { year: '2025-2026' },
    update: {},
    create: { year: '2025-2026' },
  });

  const semester = await prisma.semester.upsert({
    where: {
      semester_academicYearId: {
        semester: '3-1',
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      semester: '3-1',
      academicYearId: academicYear.id,
    },
  });

  // 4. Sample Subjects
  const subject1 = await prisma.subject.upsert({
    where: { subjectCode: 'CS301' },
    update: {},
    create: {
      subjectCode: 'CS301',
      subjectName: 'Operating Systems',
      credits: 3,
      semesterLevel: '3-1',
      departmentId: deptCSE.id,
    },
  });

  // 5. Sample Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: { passwordHash, roleId: adminRole!.id, status: UserStatus.ACTIVE },
    create: {
      name: 'System Admin',
      email: 'admin@college.edu',
      passwordHash,
      roleId: adminRole!.id,
      departmentId: deptCSE.id,
      status: UserStatus.ACTIVE,
    },
  });

  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@college.edu' },
    update: { passwordHash, roleId: facultyRole!.id, status: UserStatus.ACTIVE },
    create: {
      name: 'John Doe',
      email: 'faculty@college.edu',
      passwordHash,
      roleId: facultyRole!.id,
      departmentId: deptCSE.id,
      status: UserStatus.ACTIVE,
    },
  });

  // ==========================================
  // LEVEL 4 - INDIRECT ATTAINMENT DUMMY DATA
  // ==========================================

  // Mechanical Department
  const deptMech = await prisma.department.upsert({
    where: { departmentName: 'Mechanical' },
    update: {},
    create: { departmentName: 'Mechanical' },
  });

  // Sections
  const secMechA = await prisma.section.upsert({
    where: { sectionName_departmentId_academicYearId: { sectionName: 'A', departmentId: deptMech.id, academicYearId: academicYear.id } },
    update: {},
    create: { sectionName: 'A', departmentId: deptMech.id, academicYearId: academicYear.id },
  });

  const secMechB = await prisma.section.upsert({
    where: { sectionName_departmentId_academicYearId: { sectionName: 'B', departmentId: deptMech.id, academicYearId: academicYear.id } },
    update: {},
    create: { sectionName: 'B', departmentId: deptMech.id, academicYearId: academicYear.id },
  });

  // Subject: NM&TT (23ME3T01)
  const subjectNMTT = await prisma.subject.upsert({
    where: { subjectCode: '23ME3T01' },
    update: {},
    create: {
      subjectCode: '23ME3T01',
      subjectName: 'NM&TT',
      credits: 3,
      semesterLevel: '3-1',
      departmentId: deptMech.id,
    },
  });

  // Course Outcomes
  const cos = [
    { coCode: 'CO1', description: 'Determine efficiency of jet' },
    { coCode: 'CO2', description: 'Determine efficiencies of turbines' },
    { coCode: 'CO3', description: 'Determine efficiencies of pumps' },
    { coCode: 'CO4', description: 'Determine discharge coefficient' },
    { coCode: 'CO5', description: 'Determine friction factor' },
  ];
  
  for (const co of cos) {
    await prisma.courseOutcome.upsert({
      where: { coCode_subjectId: { coCode: co.coCode, subjectId: subjectNMTT.id } },
      update: {},
      create: { coCode: co.coCode, description: co.description, subjectId: subjectNMTT.id },
    });
  }
  
  const fetchedCOs = await prisma.courseOutcome.findMany({ where: { subjectId: subjectNMTT.id } });

  // Faculty: Dr. Kumar & Dr. Ravi
  const drKumar = await prisma.user.upsert({
    where: { employeeId: '2225' },
    update: {},
    create: {
      name: 'Dr. Kumar',
      email: 'kumar@college.edu',
      employeeId: '2225',
      passwordHash,
      roleId: facultyRole!.id,
      departmentId: deptMech.id,
      status: UserStatus.ACTIVE,
    },
  });

  const drRavi = await prisma.user.upsert({
    where: { email: 'ravi@college.edu' },
    update: {},
    create: {
      name: 'Dr. Ravi',
      email: 'ravi@college.edu',
      employeeId: '2226',
      passwordHash,
      roleId: facultyRole!.id,
      departmentId: deptMech.id,
      status: UserStatus.ACTIVE,
    },
  });

  // Faculty Assignments
  const assignmentKumar = await prisma.facultyAssignment.upsert({
    where: { facultyId_subjectId_academicYearId_semesterId_sectionId: { facultyId: drKumar.id, subjectId: subjectNMTT.id, academicYearId: academicYear.id, semesterId: semester.id, sectionId: secMechA.id } },
    update: {},
    create: { facultyId: drKumar.id, subjectId: subjectNMTT.id, academicYearId: academicYear.id, semesterId: semester.id, sectionId: secMechA.id },
  });

  const assignmentRavi = await prisma.facultyAssignment.upsert({
    where: { facultyId_subjectId_academicYearId_semesterId_sectionId: { facultyId: drRavi.id, subjectId: subjectNMTT.id, academicYearId: academicYear.id, semesterId: semester.id, sectionId: secMechB.id } },
    update: {},
    create: { facultyId: drRavi.id, subjectId: subjectNMTT.id, academicYearId: academicYear.id, semesterId: semester.id, sectionId: secMechB.id },
  });

  // Students (with new schema)
  const studentPasswordHash = await bcrypt.hash('student@123', 10);
  const dummyStudents = [
    { rollNumber: '22ME001', name: 'Rahul Kumar' },
    { rollNumber: '22ME002', name: 'Priya Sharma' },
    { rollNumber: '22ME003', name: 'Arjun Reddy' },
    { rollNumber: '22ME004', name: 'Sneha Patel' },
    { rollNumber: '22ME005', name: 'Vikram Singh' },
  ];

  const createdStudents = [];
  for (const s of dummyStudents) {
    const student = await prisma.student.upsert({
      where: { rollNumber: s.rollNumber },
      update: {},
      create: {
        rollNumber: s.rollNumber,
        name: s.name,
        passwordHash: studentPasswordHash,
      },
    });
    createdStudents.push(student);

    // Enrollments
    await prisma.studentEnrollment.upsert({
      where: { studentId_academicYearId_semesterId: { studentId: student.id, academicYearId: academicYear.id, semesterId: semester.id } },
      update: {},
      create: {
        studentId: student.id,
        departmentId: deptMech.id,
        semesterId: semester.id,
        academicYearId: academicYear.id,
        sectionId: secMechA.id, // Put them in Mech A with Dr Kumar
      },
    });
  }

  // Create an OPEN Survey
  const survey = await prisma.survey.create({
    data: {
      title: 'Mid-Sem Course Outcome Survey',
      academicYearId: academicYear.id,
      semesterId: semester.id,
      status: 'OPEN',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // open for 1 week
    }
  });

  // Inject Dummy Ratings for Rahul Kumar
  const rahulRatings = [5, 4, 4, 5, 5];
  const priyaRatings = [4, 4, 5, 4, 5];
  const arjunRatings = [3, 4, 4, 5, 4];
  const snehaRatings = [5, 5, 4, 4, 5];
  const vikramRatings= [4, 5, 5, 5, 4];
  const allRatings = [rahulRatings, priyaRatings, arjunRatings, snehaRatings, vikramRatings];

  // Inject Dummy Ratings for the first 3 students ONLY (so the others have pending surveys to test)
  for (let i = 0; i < 3; i++) {
    const student = createdStudents[i];
    const ratingsArray = allRatings[i];

    const surveyResponse = await prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        studentId: student.id,
        facultyAssignmentId: assignmentKumar.id,
      }
    });

    for (let j = 0; j < fetchedCOs.length; j++) {
      const co = fetchedCOs.find(c => c.coCode === `CO${j+1}`);
      if (co) {
        await prisma.surveyRating.create({
          data: {
            surveyResponseId: surveyResponse.id,
            courseOutcomeId: co.id,
            rating: ratingsArray[j],
          }
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
