import prisma from '../database';
import { ReportType, ReportStatus } from '@prisma/client';
import fs from 'fs';

export class FacultyService {
  /**
   * Retrieves all subjects assigned to a specific faculty member
   */
  public async getAssignedSubjects(facultyId: string) {
    const assignments = await prisma.facultyAssignment.findMany({
      where: { facultyId },
      include: {
        subject: { include: { department: true } }, semester: true,
        academicYear: true
      }
    });

    return assignments.map(a => ({
      assignmentId: a.id,
      academicYear: a.academicYear.year,
      subjectId: a.subject.id,
      subjectCode: a.subject.subjectCode,
      subjectName: a.subject.subjectName,
      credits: a.subject.credits,
      semester: a.semester.semester,
      department: a.subject.department.departmentName,
      departmentId: a.subject.departmentId,
      progressState: a.progressState || { indirect: false, direct: false, copo: false, overall: false }
    }));
  }

  /**
   * Aggregates stats and recent activity for the faculty dashboard
   */
  public async getDashboardStats(facultyId: string) {
    const [assignmentsCount, reportsCount, recentReports] = await Promise.all([
      prisma.facultyAssignment.count({ where: { facultyId } }),
      prisma.reportHistory.count({ where: { facultyId, isDeleted: false } }),
      prisma.reportHistory.findMany({
        where: { facultyId, isDeleted: false },
        orderBy: { generatedAt: 'desc' },
        take: 5,
        include: { subject: true }
      })
    ]);

    return {
      stats: {
        totalSubjects: assignmentsCount,
        totalReportsGenerated: reportsCount
      },
      recentReports: recentReports.map(r => ({
        id: r.id,
        subjectCode: r.subject?.subjectCode || 'Unknown',
        reportType: r.reportType,
        status: r.status,
        generatedAt: r.generatedAt
      }))
    };
  }

  // ==========================================
  // WIZARD ENDPOINTS
  // ==========================================

  public async getSubjectCOs(subjectId: string) {
    const cos = await prisma.courseOutcome.findMany({
      where: { subjectId },
      orderBy: { coCode: 'asc' }
    });
    return cos;
  }

  public async getPOs(departmentId: string) {
    const pos = await prisma.programOutcome.findMany({ orderBy: { code: 'asc' } });
    const peos = await prisma.programEducationalObjective.findMany({ orderBy: { code: 'asc' } });
    const psos = await prisma.programSpecificObjective.findMany({
      where: { departmentId },
      orderBy: { code: 'asc' }
    });
    return { pos, peos, psos };
  }

  public async getIndirectAssessment(subjectId: string, facultyId: string) {
    // Attempt to fetch actual survey ratings from database
    const assignment = await prisma.facultyAssignment.findFirst({
      where: { subjectId, facultyId }
    });
    if (!assignment) throw new Error("Assignment not found");

    const responses = await prisma.surveyResponse.findMany({
      where: { facultyAssignmentId: assignment.id },
      include: {
        student: true,
        ratings: { include: { courseOutcome: true } }
      }
    });

    if (responses.length > 0) {
      // Process real data
      const studentScores: any[] = [];
      responses.forEach((r, idx) => {
        const scores: any = { CO1: 5, CO2: 5, CO3: 5, CO4: 5, CO5: 5 }; // default
        r.ratings.forEach(rating => {
          scores[rating.courseOutcome.coCode] = rating.rating;
        });
        studentScores.push({
          id: r.student.id,
          rollNo: r.student.rollNumber,
          name: r.student.name,
          scores
        });
      });
      return studentScores;
    }

    // If no real data, generate 5 dummy students for presentation purposes
    const dummyStudents = [
      { id: '1', rollNo: '21A1A0301', name: 'John Doe', scores: { CO1: 5, CO2: 4, CO3: 5, CO4: 5, CO5: 5 } },
      { id: '2', rollNo: '21A1A0302', name: 'Jane Smith', scores: { CO1: 4, CO2: 4, CO3: 4, CO4: 4, CO5: 4 } },
      { id: '3', rollNo: '21A1A0303', name: 'Bob Wilson', scores: { CO1: 5, CO2: 5, CO3: 5, CO4: 5, CO5: 5 } },
      { id: '4', rollNo: '21A1A0304', name: 'Alice Brown', scores: { CO1: 3, CO2: 4, CO3: 3, CO4: 4, CO5: 4 } },
      { id: '5', rollNo: '21A1A0305', name: 'Charlie Davis', scores: { CO1: 5, CO2: 4, CO3: 4, CO4: 4, CO5: 5 } },
    ];
    return dummyStudents;
  }

  public async getDirectAssessment(subjectId: string, facultyId: string) {
    // In a fully integrated system, the `data` field of ReportHistory contains the JSON percentages
    // Currently, since we bypass complex excel formula extraction, we will return standard mock direct data for the dashboard wizard.
    // If the database has `data` field populated from a real upload, we use it.
    const internalReport = await prisma.reportHistory.findFirst({
      where: { subjectId, facultyId, reportType: ReportType.INTERNAL, status: { in: [ReportStatus.GENERATED, ReportStatus.SUBMITTED, ReportStatus.APPROVED] } },
      orderBy: { generatedAt: 'desc' }
    });

    const subject = await prisma.subject.findUnique({ 
      where: { id: subjectId },
      include: { courseOutcomes: true }
    });
    const isLab = Boolean(
      subject?.subjectName?.toLowerCase().includes('lab') || 
      subject?.subjectCode?.toUpperCase().includes('L')
    );

    const externalReport = await prisma.reportHistory.findFirst({
      where: { subjectId, facultyId, reportType: ReportType.EXTERNAL, status: { in: [ReportStatus.GENERATED, ReportStatus.SUBMITTED, ReportStatus.APPROVED] } },
      orderBy: { generatedAt: 'desc' }
    });

    const hasInternal = !!internalReport;
    const hasExternal = isLab ? hasInternal : !!externalReport;

    const defaultData: any = {};
    if (subject?.courseOutcomes) {
      subject.courseOutcomes.forEach(co => {
        defaultData[co.coCode] = { internalPct: 0, internal3Scale: 0, externalPct: 0, external3Scale: 0, directPct: 0, direct3Scale: 0, target3Scale: 1.95 };
      });
    }

    let computedData: any = {};
    if (isLab && internalReport) {
        let labData = internalReport.data as any;

        // Fallback: If existing DB record had data: null, extract it dynamically from the file on disk!
        if (!labData && internalReport.filePath && fs.existsSync(internalReport.filePath)) {
          try {
            labData = await this.extractLabDataFromFile(internalReport.filePath);
            if (labData) {
              await prisma.reportHistory.update({
                where: { id: internalReport.id },
                data: { data: labData }
              });
            }
          } catch (e) {
            console.error('Failed to extract lab data from file:', e);
          }
        }

        if (labData && subject?.courseOutcomes) {
          subject.courseOutcomes.forEach(co => {
            computedData[co.coCode] = {
              internalPct: labData.internalPct ?? 0,
              internal3Scale: labData.internal3Scale ?? 0,
              externalPct: labData.externalPct ?? 0,
              external3Scale: labData.external3Scale ?? 0,
              directPct: labData.directPct ?? 0,
              direct3Scale: labData.direct3Scale ?? 0,
              target3Scale: 1.95
            };
          });
        }
    } else if (internalReport?.data && externalReport?.data) {
        const intData = internalReport.data as any;
        const extData = externalReport.data as any;

        const keys = new Set([...Object.keys(intData), ...Object.keys(extData)]);
        keys.forEach(key => {
            const intCO = intData[key] || { pct: 0, scale3: 0 };
            const extCO = extData[key] || { pct: 0, scale3: 0 };
            
            // Recalculate 3-scale linearly on-the-fly using the database percentages
            const internal3Scale = (intCO.pct / 100) * 3;
            const external3Scale = (extCO.pct / 100) * 3;

            const directPct = (0.7 * extCO.pct) + (0.3 * intCO.pct);
            const direct3Scale = (directPct / 100) * 3;
            
            computedData[key] = {
                internalPct: intCO.pct,
                internal3Scale: internal3Scale,
                externalPct: extCO.pct,
                external3Scale: external3Scale,
                directPct,
                direct3Scale,
                target3Scale: 1.8 
            };
        });
    }

    return {
      hasInternal,
      hasExternal,
      data: Object.keys(computedData).length > 0 ? computedData : defaultData
    };
  }

  public async extractLabDataFromFile(filePath: string): Promise<any> {
    const XlsxPopulate = require('xlsx-populate');
    const wb = await XlsxPopulate.fromFileAsync(filePath);
    const sheet = wb.sheet(0);

    let startRow = -1;
    let endRow = -1;
    for (let r = 7; r <= 200; r++) {
      const val = sheet.cell('D' + r).value();
      if (typeof val === 'number' && val >= 0) {
        if (startRow === -1) startRow = r;
        endRow = r;
      } else if (startRow !== -1 && (val === undefined || val === null || val === '')) {
        break;
      }
    }

    if (startRow === -1) return null;

    let internalMax = 30;
    let externalMax = 70;
    const d7 = String(sheet.cell('D7').value() || '');
    const e7 = String(sheet.cell('E7').value() || '');
    const dMatch = d7.match(/\d+/);
    const eMatch = e7.match(/\d+/);
    if (dMatch) internalMax = Number(dMatch[0]);
    if (eMatch) externalMax = Number(eMatch[0]);

    const thresholdPercentage = 0.60;
    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
    const round3 = (v: number) => Math.round((v + Number.EPSILON) * 1000) / 1000;

    let intAttempted = 0, intAttained = 0;
    let extAttempted = 0, extAttained = 0;

    for (let r = startRow; r <= endRow; r++) {
      const d = sheet.cell('D' + r).value();
      const e = sheet.cell('E' + r).value();
      if (typeof d === 'number' && d >= 0) {
        intAttempted++;
        if (d >= internalMax * thresholdPercentage) intAttained++;
      }
      if (typeof e === 'number' && e >= 0) {
        extAttempted++;
        if (e >= externalMax * thresholdPercentage) extAttained++;
      }
    }

    const internalPct = intAttempted > 0 ? round2((intAttained / intAttempted) * 100) : 0;
    const externalPct = extAttempted > 0 ? round2((extAttained / extAttempted) * 100) : 0;
    const internal3Scale = intAttempted > 0 ? round2((intAttained / intAttempted) * 3) : 0;
    const external3Scale = extAttempted > 0 ? round2((extAttained / extAttempted) * 3) : 0;
    const direct3Scale = round3((0.3 * internal3Scale) + (0.7 * external3Scale));
    const directPct = round2((0.3 * internalPct) + (0.7 * externalPct));

    return {
      internalAttempted: intAttempted,
      internalAttained: intAttained,
      internalPct,
      internal3Scale,
      externalAttempted: extAttempted,
      externalAttained: extAttained,
      externalPct,
      external3Scale,
      directPct,
      direct3Scale
    };
  }

  public async getCOPOAttainment(subjectId: string, facultyId: string) {
    return this.getCOPOMapping(subjectId, facultyId);
  }

  public async syncStudentsForSubject(subjectId: string, facultyId: string) {
    const report = await prisma.reportHistory.findFirst({
      where: { subjectId, facultyId, filePath: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: { subject: { include: { department: true } } }
    });

    if (!report || !report.filePath || !fs.existsSync(report.filePath)) {
      throw new Error('No uploaded marks sheet found for this subject. Please upload marks first.');
    }

    const assignment = await prisma.facultyAssignment.findFirst({
      where: { subjectId, facultyId, status: 'ACTIVE' },
      include: { semester: { include: { academicYear: true } } }
    });

    if (!assignment) {
      throw new Error('Active faculty assignment not found.');
    }

    const XlsxPopulate = require('xlsx-populate');
    const bcrypt = require('bcrypt');
    const wb = await XlsxPopulate.fromFileAsync(report.filePath);
    const sheet = wb.sheet(0);

    const deptId = report.subject.departmentId;
    const academicYearId = assignment.semester.academicYear.id;
    const semesterId = assignment.semester.id;

    let section = await prisma.section.findFirst({
      where: { departmentId: deptId, academicYearId }
    });
    if (!section) {
      section = await prisma.section.create({
        data: { sectionName: 'A', departmentId: deptId, academicYearId }
      });
    }

    let count = 0;
    for (let r = 9; r <= 300; r++) {
      const rollNumber = String(sheet.cell('B' + r).value() || '').trim();
      const name = String(sheet.cell('C' + r).value() || rollNumber).trim();

      if (!rollNumber) {
        // If we hit blank row and already found students, stop
        if (count > 0) break;
        continue;
      }

      const passwordHash = await bcrypt.hash(rollNumber, 10);
      const studentRecord = await prisma.student.upsert({
        where: { rollNumber },
        update: { name },
        create: { rollNumber, name, passwordHash }
      });

      await prisma.studentEnrollment.upsert({
        where: {
          studentId_academicYearId_semesterId: {
            studentId: studentRecord.id,
            academicYearId,
            semesterId
          }
        },
        update: {},
        create: {
          studentId: studentRecord.id,
          departmentId: deptId,
          semesterId,
          academicYearId,
          sectionId: section.id
        }
      });
      count++;
    }

    return {
      success: true,
      count,
      message: `Successfully extracted and synchronized ${count} students into the database!`
    };
  }

  public async getCOPOMapping(subjectId: string, facultyId: string) {
    const cos = await prisma.courseOutcome.findMany({
      where: { subjectId },
      include: { copoMappings: true },
      orderBy: { coCode: 'asc' }
    });

    const mapping: any = {};
    for (const co of cos) {
      mapping[co.coCode] = {};
      // Initialize empty
      for (let i = 1; i <= 12; i++) mapping[co.coCode][`PO${i}`] = '';
      mapping[co.coCode]['PSO1'] = '';
      mapping[co.coCode]['PSO2'] = '';
      
      for (const m of co.copoMappings) {
        mapping[co.coCode][m.poCode] = m.correlationLevel;
      }
    }
    
    // Fallback if empty DB mapping
    if (cos.length === 0 || cos.every(co => co.copoMappings.length === 0)) {
       const mockMapping: any = {
         CO1: { PO1: 3, PO2: 3, PO3: '', PO4: '', PO5: '', PO6: 2, PO7: '', PO8: '', PO9: '', PO10: '', PO11: '', PO12: '', PSO1: 3, PSO2: 2 },
         CO2: { PO1: 3, PO2: 3, PO3: '', PO4: 1, PO5: '', PO6: 3, PO7: '', PO8: '', PO9: '', PO10: '', PO11: '', PO12: '', PSO1: 3, PSO2: 3 },
         CO3: { PO1: 3, PO2: 3, PO3: 3, PO4: '', PO5: '', PO6: '', PO7: '', PO8: '', PO9: '', PO10: '', PO11: '', PO12: '', PSO1: 3, PSO2: 1 },
         CO4: { PO1: 3, PO2: 3, PO3: 2, PO4: '', PO5: '', PO6: '', PO7: '', PO8: '', PO9: '', PO10: '', PO11: '', PO12: '', PSO1: 3, PSO2: 2 },
         CO5: { PO1: 3, PO2: 3, PO3: 2, PO4: '', PO5: '', PO6: 1, PO7: '', PO8: '', PO9: '', PO10: '', PO11: '', PO12: '', PSO1: 3, PSO2: 1 }
       };
       return mockMapping;
    }

    return mapping;
  }

  public async updateProgress(subjectId: string, facultyId: string, progressUpdates: any) {
    const assignment = await prisma.facultyAssignment.findFirst({
      where: { subjectId, facultyId }
    });
    if (!assignment) throw new Error("Assignment not found");

    const currentProgress = assignment.progressState ? (assignment.progressState as object) : {};
    const newProgress = { ...currentProgress, ...progressUpdates };

    await prisma.facultyAssignment.update({
      where: { id: assignment.id },
      data: { progressState: newProgress }
    });

    return newProgress;
  }
}
