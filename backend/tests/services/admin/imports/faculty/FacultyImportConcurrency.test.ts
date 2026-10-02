import { FacultyImportService, ConfirmOptions, BatchNotFoundError } from '../../../../../src/services/admin/imports/faculty/FacultyImportService';
import { FacultyImportValidator, FacultyImportPayload } from '../../../../../src/services/admin/imports/faculty/FacultyImportValidator';
import { ImportLifecycleService } from '../../../../../src/services/admin/imports/ImportLifecycleService';
import prisma from '../../../../../src/database';
import { ImportStatus } from '@prisma/client';

describe('FacultyImportService - Concurrency & Rollback', () => {
  let service: FacultyImportService;
  let adminUserId: string;

  beforeAll(async () => {
    service = new FacultyImportService();
    // Create an admin user for testing
    const role = await prisma.role.upsert({ where: { roleName: 'ADMIN' }, update: {}, create: { roleName: 'ADMIN' }});
    const user = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: `admin_${Date.now()}@test.local`,
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
    const payload: FacultyImportPayload = {
       validRecords: [], invalidRecords: [], creates: 0, unchanged: 0, conflicts: 0, canConfirm: true
    };
    
    const batch = await prisma.importBatch.create({
      data: {
        importType: 'FACULTY_IMPORT',
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

  it('Rollback: Injected failure causes FAILED status and no partial writes', async () => {
    // Setup a fake valid record
    const dept = await prisma.department.findFirst();
    if (!dept) throw new Error("No department found");

    const empId = `EMP_${Date.now()}`;
    const payload: FacultyImportPayload = {
       validRecords: [{
          employeeId: empId,
          facultyName: 'Test Faculty',
          canonicalDepartmentCode: dept.departmentName,
          departmentId: dept.id,
          action: 'CREATE',
          issues: []
       }], 
       invalidRecords: [], creates: 1, unchanged: 0, conflicts: 0, canConfirm: true
    };
    
    const batch = await prisma.importBatch.create({
      data: {
        importType: 'FACULTY_IMPORT',
        status: ImportStatus.PREVIEWED,
        importedBy: adminUserId,
        details: JSON.stringify(payload),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });

    // Inject failure
    await expect(service.confirm(batch.id, adminUserId, { injectFailure: true })).rejects.toThrow('Injected failure during business write');

    const finalBatch = await prisma.importBatch.findUnique({ where: { id: batch.id } });
    expect(finalBatch?.status).toBe(ImportStatus.FAILED);

    // Verify 0 partial writes
    const user = await prisma.user.findUnique({ where: { employeeId: empId } });
    expect(user).toBeNull();
  });
  
  it('Revalidation: Fails if DB state mutates before confirm', async () => {
    const dept = await prisma.department.findFirst();
    if (!dept) throw new Error("No department found");

    const empId = `EMP_STALE_${Date.now()}`;
    const payload: FacultyImportPayload = {
       validRecords: [{
          employeeId: empId,
          facultyName: 'Stale Faculty',
          canonicalDepartmentCode: dept.departmentName,
          departmentId: dept.id,
          action: 'CREATE',
          issues: []
       }], 
       invalidRecords: [], creates: 1, unchanged: 0, conflicts: 0, canConfirm: true
    };
    
    const batch = await prisma.importBatch.create({
      data: {
        importType: 'FACULTY_IMPORT',
        status: ImportStatus.PREVIEWED,
        importedBy: adminUserId,
        details: JSON.stringify(payload),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });

    // Mutate DB to invalidate the 'CREATE' action (which expects no existing user)
    const role = await prisma.role.findFirst({ where: { roleName: 'FACULTY' } });
    await prisma.user.create({
      data: {
        employeeId: empId,
        name: 'Stale Faculty',
        email: `${empId}@test.local`,
        passwordHash: 'hash',
        roleId: role!.id,
        departmentId: dept.id
      }
    });

    await expect(service.confirm(batch.id, adminUserId)).rejects.toThrow('Database state has changed since preview.');

    const finalBatch = await prisma.importBatch.findUnique({ where: { id: batch.id } });
    expect(finalBatch?.status).toBe(ImportStatus.STALE);
  });
});
