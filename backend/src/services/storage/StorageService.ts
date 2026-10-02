import * as fs from 'fs/promises';
import * as path from 'path';

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.env.REPORT_PATH || 'storage/reports');
  }

  /**
   * Generates a structured path for saving reports.
   * Path format: storage/reports/{AcademicYear}/{Department}/{Semester}/{Subject}/{FacultyId}/{FileName}.xlsx
   */
  public generatePath(
    academicYear: string,
    department: string,
    semester: string,
    subject: string,
    facultyId: string,
    fileName: string
  ): string {
    return path.join(
      this.baseDir,
      academicYear,
      department,
      semester,
      subject,
      facultyId,
      `${fileName}.xlsx`
    );
  }

  /**
   * Saves a buffer to disk, automatically creating any missing directories.
   */
  public async saveFile(filePath: string, data: Buffer): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);
  }

  /**
   * Reads a file from disk.
   */
  public async getFile(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }

  /**
   * Deletes a file from disk.
   */
  public async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }
}
