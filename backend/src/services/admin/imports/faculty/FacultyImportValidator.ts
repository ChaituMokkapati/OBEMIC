import { UserRepository } from '../../../../repositories/user.repository';
import { RawFacultyRecord } from './FacultyWorkbookReader';
import { Department } from '@prisma/client';
import prisma from '../../../../database';

export type FacultyRecordAction = 
  | 'CREATE' 
  | 'UNCHANGED' 
  | 'FACULTY_NAME_CONFLICT' 
  | 'FACULTY_DEPARTMENT_CONFLICT' 
  | 'FACULTY_PROFILE_CONFLICT';

export interface ValidatedFacultyRecord {
  employeeId: string;
  facultyName: string;
  canonicalDepartmentCode: string | null;
  departmentId: string | null; // Resolved database ID
  action: FacultyRecordAction;
  issues: string[];
}

export interface FacultyImportPayload {
  validRecords: ValidatedFacultyRecord[];
  invalidRecords: ValidatedFacultyRecord[];
  creates: number;
  unchanged: number;
  conflicts: number;
  canConfirm: boolean;
}

export class FacultyImportValidator {
  private userRepo = new UserRepository();

  public async validate(records: RawFacultyRecord[]): Promise<FacultyImportPayload> {
    const payload: FacultyImportPayload = {
      validRecords: [],
      invalidRecords: [],
      creates: 0,
      unchanged: 0,
      conflicts: 0,
      canConfirm: false
    };

    const departments = await prisma.department.findMany();
    const employeeIdMap = new Map<string, RawFacultyRecord>();
    const excelDuplicates = new Set<string>();

    for (const record of records) {
      if (employeeIdMap.has(record.employeeId)) {
        excelDuplicates.add(record.employeeId);
      } else {
        employeeIdMap.set(record.employeeId, record);
      }
    }

    for (const [empId, record] of employeeIdMap.entries()) {
      const validated: ValidatedFacultyRecord = {
        employeeId: empId,
        facultyName: record.facultyName,
        canonicalDepartmentCode: record.canonicalDepartmentCode,
        departmentId: null,
        action: 'CREATE',
        issues: []
      };

      if (excelDuplicates.has(empId)) {
        validated.issues.push('Warning: Duplicate Employee ID found in the workbook. Only the first occurrence is processed.');
      }

      if (!record.canonicalDepartmentCode) {
        validated.issues.push(`Error: Unrecognized department '${record.departmentRaw}'. Cannot associate with a valid Department.`);
        payload.invalidRecords.push(validated);
        payload.conflicts++;
        continue;
      }

      const dbDept = departments.find(d => {
        const allowedNames = resolveDbDeptName(record.canonicalDepartmentCode!);
        return allowedNames.includes(d.departmentName.toUpperCase()) || d.departmentName.toUpperCase() === record.canonicalDepartmentCode;
      });

      if (!dbDept) {
         validated.issues.push(`Error: Department '${record.canonicalDepartmentCode}' is configured but not found in the database.`);
         payload.invalidRecords.push(validated);
         payload.conflicts++;
         continue;
      }
      
      validated.departmentId = dbDept.id;

      const existingUser = await this.userRepo.findByEmployeeId(empId);

      if (existingUser) {
        const nameDiffers = existingUser.name.toUpperCase() !== record.facultyName.toUpperCase();
        const deptDiffers = existingUser.departmentId !== dbDept.id;

        if (nameDiffers && deptDiffers) {
          validated.action = 'FACULTY_PROFILE_CONFLICT';
          validated.issues.push(`Profile Conflict: Database Name ('${existingUser.name}') and Department differ from uploaded data.`);
        } else if (nameDiffers) {
          validated.action = 'FACULTY_NAME_CONFLICT';
          validated.issues.push(`Name Conflict: Database Name ('${existingUser.name}') differs from uploaded Name ('${record.facultyName}').`);
        } else if (deptDiffers) {
          validated.action = 'FACULTY_DEPARTMENT_CONFLICT';
          validated.issues.push(`Department Conflict: Database Department differs from uploaded Department.`);
        } else {
          validated.action = 'UNCHANGED';
        }

        if (validated.action !== 'UNCHANGED') {
          payload.conflicts++;
          payload.invalidRecords.push(validated);
          continue; // It's an invalid record, we do not push to validRecords
        } else {
          payload.unchanged++;
        }
      } else {
        validated.action = 'CREATE';
        payload.creates++;
      }

      payload.validRecords.push(validated);
    }

    payload.canConfirm = payload.invalidRecords.length === 0 && payload.validRecords.length > 0;

    return payload;
  }
}

function resolveDbDeptName(code: string) {
    const map: Record<string, string[]> = {
        'CSE': ['COMPUTER SCIENCE AND ENGINEERING', 'CSE'],
        'MECH': ['MECHANICAL ENGINEERING', 'MECHANICAL', 'MECH'],
        'ECE': ['ELECTRONICS AND COMMUNICATION ENGINEERING', 'ECE'],
        'IT': ['INFORMATION TECHNOLOGY', 'IT'],
        'CIVIL': ['CIVIL ENGINEERING', 'CIVIL'],
        'EEE': ['ELECTRICAL AND ELECTRONICS ENGINEERING', 'EEE'],
        'AIDS': ['ARTIFICIAL INTELLIGENCE AND DATA SCIENCE', 'AIDS', 'AI&DS'],
        'AIML': ['ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING', 'AIML', 'AI&ML'],
    };
    return map[code] || [code];
}
