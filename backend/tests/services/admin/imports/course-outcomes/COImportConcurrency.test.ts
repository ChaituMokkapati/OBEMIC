import { COImportService, ConfirmOptions, BatchNotFoundError } from '../../../../../src/services/admin/imports/course-outcomes/COImportService';
import { COImportPayload } from '../../../../../src/services/admin/imports/course-outcomes/COImportValidator';
import prisma from '../../../../../src/database';
import { ImportStatus } from '@prisma/client';

describe('COImportService - Concurrency & Rollback', () => {
  let service: COImportService;
  let adminUserId: string;

  beforeAll(async () => {
    service = new COImportService();
    const role = await prisma.role.upsert({ where: { roleName: 'ADMIN' }, update: {}, create: { roleName: 'ADMIN' }});
    const user = await prisma.user.create({
      data: {
        name: 'Admin Test CO',
        email: `admin_co_${Date.now()}@test.local`,
        passwordHash: 'hash',
        roleId: role.id
      }
    });
    adminUserId = user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Concurrent Confirm: Exactly one succeeds, one fails with deterministic error', async () => {
    const payload: COImportPayload = {
       validBlocks: [], invalidBlocks: [], creates: { subjects: 0, cos: 0 }, unchanged: { subjects: 0, cos: 0 }, conflicts: { subjects: 0, cos: 0 }, canConfirm: true
    };
    
    const batch = await prisma.importBatch.create({
      data: {
        importType: 'CO_IMPORT',
        status: ImportStatus.PREVIEWED,
        importedBy: adminUserId,
        details: JSON.stringify(payload),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });

    const p1 = service.confirm(batch.id, adminUserId);
    const p2 = service.confirm(batch.id, adminUserId);

    const results = await Promise.allSettled([p1, p2]);
    
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const finalBatch = await prisma.importBatch.findUnique({ where: { id: batch.id } });
    expect(finalBatch?.status).toBe(ImportStatus.CONFIRMED);
  });

  it('Rollback: Injected failure causes FAILED status and no partial Subject/CO writes', async () => {
    let dept = await prisma.department.findFirst();
    if (!dept) {
       dept = await prisma.department.create({ data: { departmentName: 'TEST_DEPT' }});
    }

    let reg = await prisma.regulation.findFirst();
    if (!reg) {
       reg = await prisma.regulation.create({ data: { name: 'R20' }});
    }

    const ay = await prisma.academicYear.upsert({
       where: { year: '2023-2024' },
       update: {},
       create: { year: '2023-2024' }
    });

    let sem = await prisma.semester.findFirst();
    if (!sem) {
       sem = await prisma.semester.create({ data: { semester: '3-1', academicYearId: ay.id }});
    }

    const subjCode = `SUBJ_${Date.now()}`;
    const payload: COImportPayload = {
       validBlocks: [{
          normalizedSubjectCode: subjCode,
          subjectName: 'Test Subject',
          departmentId: dept.id,
          regulationId: reg.id,
          semesterLevel: sem.id,
          action: 'CREATE',
          courseOutcomes: [
            { coCode: 'CO1', description: 'desc', action: 'CREATE', issues: [] }
          ],
          issues: []
       }], 
       invalidBlocks: [], creates: { subjects: 1, cos: 1 }, unchanged: { subjects: 0, cos: 0 }, conflicts: { subjects: 0, cos: 0 }, canConfirm: true
    };
    
    const batch = await prisma.importBatch.create({
      data: {
        importType: 'CO_IMPORT',
        status: ImportStatus.PREVIEWED,
        importedBy: adminUserId,
        details: JSON.stringify(payload),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });

    // Inject failure
    await expect(service.confirm(batch.id, adminUserId, { injectFailure: true })).rejects.toThrow('Injected failure during Subject creation');

    const finalBatch = await prisma.importBatch.findUnique({ where: { id: batch.id } });
    expect(finalBatch?.status).toBe(ImportStatus.FAILED);

    // Verify 0 partial writes
    const subject = await prisma.subject.findUnique({ where: { subjectCode: subjCode } });
    expect(subject).toBeNull();
  });
});
