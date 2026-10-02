import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROGRAM_OUTCOMES = [
  { code: 'PO1', title: 'Engineering Knowledge', description: 'Apply knowledge of mathematics, science, engineering fundamentals, and specialization to solve complex engineering problems.' },
  { code: 'PO2', title: 'Problem Analysis', description: 'Identify, formulate, research literature, and analyze complex engineering problems reaching substantiated conclusions.' },
  { code: 'PO3', title: 'Design/Development of Solutions', description: 'Design solutions for complex engineering problems and design system components or processes that meet specific needs.' },
  { code: 'PO4', title: 'Conduct Investigations of Complex Problems', description: 'Use research-based knowledge and research methods including design of experiments, analysis, and interpretation of data.' },
  { code: 'PO5', title: 'Modern Tool Usage', description: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools.' },
  { code: 'PO6', title: 'The Engineer and Society', description: 'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal, and cultural issues.' },
  { code: 'PO7', title: 'Environment and Sustainability', description: 'Understand the impact of professional engineering solutions in societal and environmental contexts, demonstrating sustainable development.' },
  { code: 'PO8', title: 'Ethics', description: 'Apply ethical principles and commit to professional ethics and responsibilities and norms of engineering practice.' },
  { code: 'PO9', title: 'Individual and Team Work', description: 'Function effectively as an individual, and as a member or leader in diverse teams and multi-disciplinary settings.' },
  { code: 'PO10', title: 'Communication', description: 'Communicate effectively on complex engineering activities with the engineering community and society at large.' },
  { code: 'PO11', title: 'Project Management and Finance', description: 'Demonstrate knowledge and understanding of engineering and management principles to manage projects.' },
  { code: 'PO12', title: 'Life-long Learning', description: 'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning.' }
];

const PROGRAM_EDUCATIONAL_OBJECTIVES = [
  { code: 'PEO1', title: 'Professional Excellence', description: 'Graduates will possess solid fundamental knowledge of engineering and science to solve complex real-world problems and pursue higher studies.' },
  { code: 'PEO2', title: 'Innovation and Design', description: 'Graduates will be able to design, develop and implement innovative and cost-effective solutions for engineering problems taking into account environmental, social and economic constraints.' },
  { code: 'PEO3', title: 'Leadership and Ethics', description: 'Graduates will exhibit professional and ethical attitude, effective communication skills, teamwork skills, multidisciplinary approach, and an ability to relate engineering issues to broader social context.' },
  { code: 'PEO4', title: 'Lifelong Learning', description: 'Graduates will recognize the need for and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological changes.' }
];

const PROGRAM_SPECIFIC_OUTCOMES = [
  { code: 'PSO1', title: 'Software Development', description: 'Apply software engineering practices and strategies in software project development using open-source programming environment to deliver a quality product.' },
  { code: 'PSO2', title: 'Data Science & AI', description: 'Design and develop computer programs and computer-based systems in the areas related to Data Science, Artificial Intelligence and Machine Learning.' }
];

async function main() {
  console.log('Seeding POs, PEOs, and PSOs...');

  for (const po of PROGRAM_OUTCOMES) {
    await prisma.programOutcome.upsert({
      where: { code: po.code },
      update: {},
      create: { code: po.code, title: po.title, description: po.description }
    });
  }

  for (const peo of PROGRAM_EDUCATIONAL_OBJECTIVES) {
    await prisma.programEducationalObjective.upsert({
      where: { code: peo.code },
      update: {},
      create: { code: peo.code, title: peo.title, description: peo.description }
    });
  }

  const depts = await prisma.department.findMany();
  for (const dept of depts) {
    for (const pso of PROGRAM_SPECIFIC_OUTCOMES) {
      // Create PSOs for every department just to seed it globally
      await prisma.programSpecificObjective.upsert({
        where: { code_departmentId: { code: pso.code, departmentId: dept.id } },
        update: {},
        create: { code: pso.code, title: pso.title, description: pso.description, departmentId: dept.id }
      });
    }
  }

  console.log('Successfully seeded outcomes!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
