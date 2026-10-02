import { StorageService } from './storage/StorageService';
import { ReportRepository } from '../repositories/report.repository';
import { InternalAttainmentService } from './attainment/internal/InternalAttainmentService';
import { ExternalAttainmentService } from './attainment/external/ExternalAttainmentService';
import { LabAttainmentService } from './attainment/lab/LabAttainmentService';
import prisma from '../database';
import { ReportType, ReportStatus } from '@prisma/client';
const XlsxPopulate = require('xlsx-populate'); // To extract subjectCode temporarily

export class ReportService {
  private attainmentService = new InternalAttainmentService();
  private storageService = new StorageService();
  private reportRepo = new ReportRepository();

  public async processAndSaveReport(facultyId: string, facultyBuffer: Buffer, subjectCode: string) {
    let subjectName = 'NM&TT (23ME3T01)';

    const subject: any = await prisma.subject.findUnique({
      where: { subjectCode },
      include: { 
        department: true, 
        courseOutcomes: true
      }
    });

    if (!subject) {
      throw new Error(`Subject Code '${subjectCode}' found in Excel does not exist in the database. Please contact Admin.`);
    }

    const assignment = await prisma.facultyAssignment.findFirst({
      where: { facultyId, subjectId: subject.id, status: 'ACTIVE' },
      include: { semester: { include: { academicYear: true } } },
      orderBy: { createdAt: 'desc' }
    });

    if (!assignment) {
       throw new Error(`You are not actively assigned to this subject. Please contact Admin.`);
    }
    
    // Polyfill the semester for the rest of the script
    subject.semester = assignment.semester;

    if (!subject.courseOutcomes || subject.courseOutcomes.length === 0) {
      throw new Error(`Subject Code '${subjectCode}' does not have any Course Outcomes mapped in the database. Please contact Admin.`);
    }

    // Sort COs logically (CO1, CO2, etc.)
    const sortedCOs = subject.courseOutcomes.sort((a: any, b: any) => a.coCode.localeCompare(b.coCode));

    // 1. Generate Report (pass subjectCode, not subjectName, and the sorted COs)
    const { outputBuffer, report } = await this.attainmentService.generateAttainment(facultyBuffer, subject.subjectCode, sortedCOs);

    // 2. Save to Disk
    const academicYearStr = subject.semester.academicYear.year;
    const deptStr = subject.department.departmentName;
    const semStr = subject.semester.semester;
    
    const filePath = this.storageService.generatePath(
      academicYearStr,
      deptStr,
      semStr,
      subject.subjectCode,
      facultyId,
      `Generated_Internal_OBE_${Date.now()}.xlsx`
    );

    await this.storageService.saveFile(filePath, outputBuffer as Buffer);

    // 3. Persist Metadata
    const history = await this.reportRepo.createReportHistory({
      facultyId,
      subjectId: subject.id,
      reportType: ReportType.INTERNAL,
      status: ReportStatus.GENERATED,
      filePath,
      fileSize: outputBuffer.byteLength,
      data: report.computedData // Save the calculated JSON
    });

    // 4. Log Audit Event
    await prisma.auditLog.create({
      data: {
        userId: facultyId,
        action: 'GENERATED_REPORT',
        entity: 'ReportHistory',
        entityId: history.id
      }
    });

    return { outputBuffer, history, verificationReport: report };
  }

  public async processAndSaveExternalReport(facultyId: string, facultyBuffer: Buffer, subjectCode: string) {
    let subjectName = 'Sheet1'; 

    const subject: any = await prisma.subject.findUnique({
      where: { subjectCode },
      include: { 
        department: true, 
        courseOutcomes: true
      }
    });

    if (!subject) {
      throw new Error(`Subject Code '${subjectCode}' found in Excel does not exist in the database. Please contact Admin.`);
    }

    const assignment = await prisma.facultyAssignment.findFirst({
      where: { facultyId, subjectId: subject.id, status: 'ACTIVE' },
      include: { semester: { include: { academicYear: true } } },
      orderBy: { createdAt: 'desc' }
    });

    if (!assignment) {
       throw new Error(`You are not actively assigned to this subject. Please contact Admin.`);
    }
    
    // Polyfill the semester for the rest of the script
    subject.semester = assignment.semester;

    if (!subject.courseOutcomes || subject.courseOutcomes.length === 0) {
      throw new Error(`Subject Code '${subjectCode}' does not have any Course Outcomes mapped in the database. Please contact Admin.`);
    }

    const sortedCOs = subject.courseOutcomes.sort((a: any, b: any) => a.coCode.localeCompare(b.coCode));

    // 1. Generate Report
    const externalService = new ExternalAttainmentService();
    const { outputBuffer, report, students } = await externalService.generateAttainment(facultyBuffer, subjectName, sortedCOs);

    // 1.5 Synchronize Students in DB
    const bcrypt = require('bcrypt');
    if (students && students.length > 0) {
       for (const st of students) {
          // Upsert student
          const passwordHash = await bcrypt.hash(st.rollNumber, 10);
          
          const studentRecord = await prisma.student.upsert({
             where: { rollNumber: st.rollNumber },
             update: {}, // Keep existing data
             create: {
                rollNumber: st.rollNumber,
                name: st.name || st.rollNumber,
                passwordHash
             }
          });

          // Ensure enrollment
          // First we need the default section for this subject assignment
          // We'll create a default "A" section if it doesn't exist to bind the student
          let section = await prisma.section.findFirst({
             where: { departmentId: subject.departmentId, academicYearId: subject.semester.academicYear.id }
          });
          if (!section) {
             section = await prisma.section.create({
                data: {
                   sectionName: 'A',
                   departmentId: subject.departmentId,
                   academicYearId: subject.semester.academicYear.id
                }
             });
          }

          await prisma.studentEnrollment.upsert({
             where: {
                studentId_academicYearId_semesterId: {
                   studentId: studentRecord.id,
                   academicYearId: subject.semester.academicYear.id,
                   semesterId: subject.semester.id
                }
             },
             update: {},
             create: {
                studentId: studentRecord.id,
                departmentId: subject.departmentId,
                semesterId: subject.semester.id,
                academicYearId: subject.semester.academicYear.id,
                sectionId: section.id
             }
          });
       }
    }

    // 2. Save to Disk
    const academicYearStr = subject.semester.academicYear.year;
    const deptStr = subject.department.departmentName;
    const semStr = subject.semester.semester;
    
    const filePath = this.storageService.generatePath(
      academicYearStr,
      deptStr,
      semStr,
      subject.subjectCode,
      facultyId,
      `Generated_External_OBE_${Date.now()}.xlsx`
    );

    await this.storageService.saveFile(filePath, outputBuffer as Buffer);

    // 3. Persist Metadata
    const history = await this.reportRepo.createReportHistory({
      facultyId,
      subjectId: subject.id,
      reportType: ReportType.EXTERNAL,
      status: ReportStatus.GENERATED,
      filePath,
      fileSize: outputBuffer.byteLength,
      data: report.computedData // Save the calculated JSON
    });

    // 4. Log Audit Event
    await prisma.auditLog.create({
      data: {
        userId: facultyId,
        action: 'GENERATED_EXTERNAL_REPORT',
        entity: 'ReportHistory',
        entityId: history.id
      }
    });

    return { outputBuffer, history, verificationReport: report };
  }

  public async processAndSaveLabReport(facultyId: string, facultyBuffer: Buffer, subjectCode: string) {
    let subjectName = 'Sheet1'; 

    const subject: any = await prisma.subject.findUnique({
      where: { subjectCode },
      include: { 
        department: true, 
        courseOutcomes: true
      }
    });

    if (!subject) {
      throw new Error(`Subject Code '${subjectCode}' found in Excel does not exist in the database. Please contact Admin.`);
    }

    const assignment = await prisma.facultyAssignment.findFirst({
      where: { facultyId, subjectId: subject.id, status: 'ACTIVE' },
      include: { semester: { include: { academicYear: true } } },
      orderBy: { createdAt: 'desc' }
    });

    if (!assignment) {
       throw new Error(`You are not actively assigned to this subject. Please contact Admin.`);
    }
    
    // Polyfill the semester for the rest of the script
    subject.semester = assignment.semester;

    if (!subject.courseOutcomes || subject.courseOutcomes.length === 0) {
      throw new Error(`Subject Code '${subjectCode}' does not have any Course Outcomes mapped in the database. Please contact Admin.`);
    }

    const sortedCOs = subject.courseOutcomes.sort((a: any, b: any) => a.coCode.localeCompare(b.coCode));

    // 1. Generate Report
    const labService = new LabAttainmentService();
    const { outputBuffer, report, students } = await labService.generateAttainment(facultyBuffer, subjectName);

    // 1.5 Synchronize Students in DB
    const bcrypt = require('bcrypt');
    if (students && students.length > 0) {
      let section = await prisma.section.findFirst({
        where: { departmentId: subject.departmentId, academicYearId: subject.semester.academicYear.id }
      });
      if (!section) {
        section = await prisma.section.create({
          data: {
            sectionName: 'A',
            departmentId: subject.departmentId,
            academicYearId: subject.semester.academicYear.id
          }
        });
      }

      for (const st of students) {
        const passwordHash = await bcrypt.hash(st.rollNumber, 10);
        const studentRecord = await prisma.student.upsert({
          where: { rollNumber: st.rollNumber },
          update: { name: st.name },
          create: {
            rollNumber: st.rollNumber,
            name: st.name || st.rollNumber,
            passwordHash
          }
        });

        await prisma.studentEnrollment.upsert({
          where: {
            studentId_academicYearId_semesterId: {
              studentId: studentRecord.id,
              academicYearId: subject.semester.academicYear.id,
              semesterId: subject.semester.id
            }
          },
          update: {},
          create: {
            studentId: studentRecord.id,
            departmentId: subject.departmentId,
            semesterId: subject.semester.id,
            academicYearId: subject.semester.academicYear.id,
            sectionId: section.id
          }
        });
      }
    }

    // 2. Save to Disk
    const academicYearStr = subject.semester.academicYear.year;
    const deptStr = subject.department.departmentName;
    const semStr = subject.semester.semester;
    
    const filePath = this.storageService.generatePath(
      academicYearStr,
      deptStr,
      semStr,
      subject.subjectCode,
      facultyId,
      `Generated_Lab_OBE_${Date.now()}.xlsx`
    );

    await this.storageService.saveFile(filePath, outputBuffer as Buffer);

    // 3. Persist Metadata
    const history = await this.reportRepo.createReportHistory({
      facultyId,
      subjectId: subject.id,
      reportType: ReportType.INTERNAL, // Could add LAB to enum if needed, fallback to INTERNAL
      status: ReportStatus.GENERATED,
      filePath,
      fileSize: outputBuffer.byteLength,
      data: report.computedData
    });

    // 4. Log Audit Event
    await prisma.auditLog.create({
      data: {
        userId: facultyId,
        action: 'GENERATED_LAB_REPORT',
        entity: 'ReportHistory',
        entityId: history.id
      }
    });

    return { outputBuffer, history, verificationReport: report };
  }

  public async getHistory(facultyId: string) {
    return this.reportRepo.getReportsByFaculty(facultyId);
  }

  public async getReport(id: string) {
    return this.reportRepo.getReportById(id);
  }

  public async submitReport(id: string, facultyId: string) {
    const report = await this.reportRepo.getReportById(id);
    if (!report) {
      throw new Error('Report not found');
    }
    if (report.facultyId !== facultyId) {
      throw new Error('Unauthorized to submit this report');
    }
    if (report.status !== ReportStatus.GENERATED) {
      throw new Error(`Report cannot be submitted. Current status: ${report.status}`);
    }

    const updated = await this.reportRepo.updateReportStatus(id, ReportStatus.SUBMITTED);

    await prisma.auditLog.create({
      data: {
        userId: facultyId,
        action: 'SUBMITTED_REPORT',
        entity: 'ReportHistory',
        entityId: id
      }
    });

    return updated;
  }
}
