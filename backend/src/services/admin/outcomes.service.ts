import prisma from '../../database';
import { ProgramOutcome, ProgramEducationalObjective, ProgramSpecificObjective } from '@prisma/client';

export class OutcomesService {
  public async getOutcomes(departmentId?: string) {
    const pos = await prisma.programOutcome.findMany({
      orderBy: { code: 'asc' }
    });

    const peos = await prisma.programEducationalObjective.findMany({
      orderBy: { code: 'asc' }
    });

    let psos: ProgramSpecificObjective[] = [];
    if (departmentId) {
      psos = await prisma.programSpecificObjective.findMany({
        where: { departmentId },
        orderBy: { code: 'asc' }
      });
    }

    return { pos, peos, psos };
  }

  public async upsertProgramOutcome(data: { code: string; title: string; description: string }) {
    return prisma.programOutcome.upsert({
      where: { code: data.code },
      update: {
        title: data.title,
        description: data.description
      },
      create: data
    });
  }

  public async upsertProgramEducationalObjective(data: { code: string; title: string; description: string }) {
    return prisma.programEducationalObjective.upsert({
      where: { code: data.code },
      update: {
        title: data.title,
        description: data.description
      },
      create: data
    });
  }

  public async upsertProgramSpecificObjective(data: { code: string; title: string; description: string; departmentId: string }) {
    return prisma.programSpecificObjective.upsert({
      where: {
        code_departmentId: {
          code: data.code,
          departmentId: data.departmentId
        }
      },
      update: {
        title: data.title,
        description: data.description
      },
      create: data
    });
  }

  public async updateProgramOutcome(id: string, data: { title?: string; description?: string }) {
    return prisma.programOutcome.update({
      where: { id },
      data
    });
  }

  public async updateProgramEducationalObjective(id: string, data: { title?: string; description?: string }) {
    return prisma.programEducationalObjective.update({
      where: { id },
      data
    });
  }

  public async updateProgramSpecificObjective(id: string, data: { title?: string; description?: string }) {
    return prisma.programSpecificObjective.update({
      where: { id },
      data
    });
  }
}
