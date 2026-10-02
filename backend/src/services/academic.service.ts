import { AcademicRepository } from '../repositories/academic.repository';
import { SubjectCodeParser } from './academic/SubjectCodeParser';
import { resolveDepartmentConfigBySubjectToken } from '../config/branch-codes';
import prisma from '../database';

export class AcademicService {
  private repo: AcademicRepository;

  constructor(repo?: AcademicRepository) {
    this.repo = repo || new AcademicRepository();
  }

  async getDepartments() {
    return this.repo.getAllDepartments();
  }

  async createAcademicYear(year: string) {
    if (!year.match(/^\d{4}-\d{4}$/)) {
      throw new Error('Invalid academic year format. Use YYYY-YYYY');
    }
    return this.repo.createAcademicYear(year);
  }

  async getAcademicYears() {
    return this.repo.getAllAcademicYears();
  }

  async createSemester(semester: string, academicYearId: string) {
    return this.repo.createSemester(semester, academicYearId);
  }

  async createSubject(data: { subjectCode: string; subjectName: string; credits?: number; semesterLevel: string; departmentId?: string }) {
    let deptId = data.departmentId;

    if (!deptId) {
      // Auto-detect from subject code
      const parsed = SubjectCodeParser.parse(data.subjectCode);
      const config = resolveDepartmentConfigBySubjectToken(parsed.subjectBranchToken);
      if (!config) throw new Error(`Could not resolve department for subject token ${parsed.subjectBranchToken}`);
      
      // Find the department in the DB by its canonical name or code
      const dbDepts = await prisma.department.findMany();
      const dbDept = dbDepts.find(d => 
        d.departmentName.toUpperCase() === config.departmentCode.toUpperCase() ||
        d.departmentName.toUpperCase() === config.departmentName.toUpperCase() ||
        config.aliases.includes(d.departmentName.toUpperCase())
      );
      if (!dbDept) throw new Error(`Department ${config.departmentName} not found in database. Please create it first.`);
      deptId = dbDept.id;
    }

    return this.repo.createSubject({
      ...data,
      departmentId: deptId
    });
  }

  async getAllSubjects() {
    return this.repo.getAllSubjects();
  }

  async createSection(data: { sectionName: string; departmentId: string; academicYearId: string }) {
    return this.repo.createSection(data);
  }

  async assignFaculty(facultyId: string, subjectId: string, academicYearId: string, sectionId?: string | null, assignedBy?: string) {
    return this.repo.assignFacultyToSubject(facultyId, subjectId, academicYearId, sectionId, assignedBy);
  }

  async unassignFaculty(assignmentId: string) {
    return this.repo.unassignFacultyFromSubject(assignmentId);
  }

  async getFacultyAssignments(facultyId: string) {
    return this.repo.getFacultyAssignments(facultyId);
  }
}
