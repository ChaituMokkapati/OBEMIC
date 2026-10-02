import { RawSubjectBlock } from './COWorkbookReader';
import { resolveDepartmentConfigBySubjectToken, resolveDepartmentCodeByAlias } from '../../../../config/branch-codes';
import prisma from '../../../../database';
import { Subject, CourseOutcome, Department, Regulation } from '@prisma/client';

export type SubjectRecordAction = 'CREATE' | 'UNCHANGED' | 'DATABASE_CONFLICT' | 'CONTEXT_CONFLICT';
export type CORecordAction = 'CREATE' | 'UNCHANGED' | 'CO_CONTENT_CONFLICT';

export interface ValidatedCO {
  coCode: string;
  description: string;
  action: CORecordAction;
  issues: string[];
  poMatrix?: Record<string, number>;
}

export interface ValidatedSubjectBlock {
  normalizedSubjectCode: string;
  subjectName: string;
  departmentId: string | null;
  regulationId: string | null;
  semesterLevel: string | null;
  action: SubjectRecordAction;
  courseOutcomes: ValidatedCO[];
  issues: string[];
}

export interface COImportPayload {
  validBlocks: ValidatedSubjectBlock[];
  invalidBlocks: ValidatedSubjectBlock[];
  creates: { subjects: number, cos: number };
  unchanged: { subjects: number, cos: number };
  conflicts: { subjects: number, cos: number };
  canConfirm: boolean;
}

export class COImportValidator {
  public async validate(blocks: RawSubjectBlock[]): Promise<COImportPayload> {
    const payload: COImportPayload = {
      validBlocks: [],
      invalidBlocks: [],
      creates: { subjects: 0, cos: 0 },
      unchanged: { subjects: 0, cos: 0 },
      conflicts: { subjects: 0, cos: 0 },
      canConfirm: false
    };

    // Prefetch all data
    const dbDepts = await prisma.department.findMany();
    const dbRegulations = await prisma.regulation.findMany();
    // Assuming Semesters can be looked up or checked dynamically.
    const dbSemesters = await prisma.semester.findMany();

    const uniqueSubjectsMap = new Map<string, RawSubjectBlock>();
    
    // De-duplicate blocks in excel
    for (const block of blocks) {
      if (!uniqueSubjectsMap.has(block.parsedSubjectCode.normalizedSubjectCode)) {
        uniqueSubjectsMap.set(block.parsedSubjectCode.normalizedSubjectCode, block);
      } else {
         // Duplicate subject in excel
      }
    }

    for (const [subjCode, block] of uniqueSubjectsMap.entries()) {
      const validated: ValidatedSubjectBlock = {
        normalizedSubjectCode: subjCode,
        subjectName: block.subjectName || 'Unknown Subject',
        departmentId: null,
        regulationId: null,
        semesterLevel: null,
        action: 'CREATE',
        courseOutcomes: [],
        issues: []
      };

      // 1. Resolve Canonical Department from Subject Code
      const deptConfig = resolveDepartmentConfigBySubjectToken(block.parsedSubjectCode.subjectBranchToken);
      if (!deptConfig) {
        validated.issues.push(`Error: Unknown Subject-Code Token '${block.parsedSubjectCode.subjectBranchToken}'.`);
        validated.action = 'CONTEXT_CONFLICT';
      } else {
        // Does workbook context match canonical?
        const wbDeptConfig = block.workbookDepartment ? resolveDepartmentCodeByAlias(block.workbookDepartment) : null;
        if (wbDeptConfig && wbDeptConfig.departmentCode !== deptConfig.departmentCode) {
           validated.issues.push(`Context Conflict: Workbook department '${block.workbookDepartment}' conflicts with Subject Code department '${deptConfig.departmentCode}'.`);
           validated.action = 'CONTEXT_CONFLICT';
        }

        // Map to DB department
        const dbDept = dbDepts.find(d => {
          const dbName = d.departmentName.toUpperCase();
          return dbName === deptConfig.departmentCode || 
                 dbName === deptConfig.departmentName.toUpperCase() ||
                 deptConfig.aliases.includes(dbName) ||
                 deptConfig.departmentName.toUpperCase().includes(dbName);
        });
        if (dbDept) {
          validated.departmentId = dbDept.id;
        } else {
          validated.issues.push(`Error: Department '${deptConfig.departmentCode}' not found in DB.`);
          validated.action = 'CONTEXT_CONFLICT';
        }
      }

      // 2. Resolve Regulation
      const dbReg = dbRegulations.find(r => r.name === block.parsedSubjectCode.regulationCode || r.name.includes(block.parsedSubjectCode.regulationCode));
      if (dbReg) {
         validated.regulationId = dbReg.id;
      } else {
         // Don't flag as conflict, just leave it null (it is optional in Prisma)
         validated.regulationId = null;
      }

      // 3. Resolve Semester (map absolute number to Y-S format, e.g. 3 -> 2-1)
      const absoluteSem = block.parsedSubjectCode.semesterNumber;
      const year = Math.ceil(absoluteSem / 2);
      const sem = (absoluteSem % 2 === 0) ? 2 : 1;
      const mappedSemName = `${year}-${sem}`;
      
      // Since subjects are completely decoupled from Semester records, we just assign the level
      validated.semesterLevel = mappedSemName;

      // Check existing Subject
      const existingSubject = await prisma.subject.findUnique({ 
        where: { subjectCode: subjCode },
        include: { courseOutcomes: true, department: true, regulation: true }
      });

      if (existingSubject) {
         // Clear context conflicts from parsing since we will use the existing DB context
         validated.issues = [];
         validated.departmentId = existingSubject.departmentId;
         validated.regulationId = existingSubject.regulationId;
         validated.semesterLevel = existingSubject.semesterLevel;
         validated.action = 'UNCHANGED';

         // Identity checks
         if (existingSubject.subjectName.toUpperCase() !== validated.subjectName.toUpperCase()) {
            validated.action = 'DATABASE_CONFLICT';
            validated.issues.push(`Database Conflict: Subject Name differs. DB: '${existingSubject.subjectName}', Upload: '${validated.subjectName}'`);
         }
      } else {
         // It doesn't exist, so we must have a valid department and semester to CREATE it
         if (!validated.departmentId) {
            validated.action = 'CONTEXT_CONFLICT';
            if (!validated.departmentId) validated.issues.push('Context Conflict: Department could not be resolved for new subject.');
            
         }
      }

      // Process COs
      const uniqueCosMap = new Map<string, any>();
      for (const co of block.courseOutcomes) {
         if (!uniqueCosMap.has(co.coCode)) {
            uniqueCosMap.set(co.coCode, co);
         }
      }

      for (const [coCode, coBlock] of uniqueCosMap.entries()) {
         const description = coBlock.description;
         const poMatrix = coBlock.poMatrix;
         const vCo: ValidatedCO = { coCode, description, poMatrix, action: 'CREATE', issues: [] };
         if (existingSubject) {
            const exCo = existingSubject.courseOutcomes.find((c: any) => c.coCode === coCode);
            if (exCo) {
               if (exCo.description !== description) {
                  vCo.action = 'CO_CONTENT_CONFLICT';
                  vCo.issues.push(`CO Conflict: Description differs from existing DB record.`);
               } else {
                  vCo.action = 'UNCHANGED';
               }
            }
         }
         validated.courseOutcomes.push(vCo);
      }

      // Tabulate metrics
      if (validated.action === 'CREATE') payload.creates.subjects++;
      if (validated.action === 'UNCHANGED') payload.unchanged.subjects++;
      if (validated.action === 'DATABASE_CONFLICT' || validated.action === 'CONTEXT_CONFLICT') {
         payload.conflicts.subjects++;
         payload.invalidBlocks.push(validated);
      } else {
         payload.validBlocks.push(validated);
      }

      for (const co of validated.courseOutcomes) {
         if (co.action === 'CREATE') payload.creates.cos++;
         if (co.action === 'UNCHANGED') payload.unchanged.cos++;
         if (co.action === 'CO_CONTENT_CONFLICT') payload.conflicts.cos++;
      }
    }
    
    // Only can confirm if there are no invalid blocks and no CO conflicts in valid blocks
    payload.canConfirm = payload.invalidBlocks.length === 0 && payload.validBlocks.length > 0 && 
                         payload.validBlocks.every(b => b.courseOutcomes.every(c => c.action !== 'CO_CONTENT_CONFLICT'));

    return payload;
  }
}
