import { FacultyWorkbookReader } from '../../../../../src/services/admin/imports/faculty/FacultyWorkbookReader';
import xlsx from 'xlsx-populate';
import fs from 'fs';
import path from 'path';

describe('Faculty Dynamic Parser Integration', () => {
  let reader: FacultyWorkbookReader;
  const testFilePath = path.join(__dirname, 'test_faculty.xlsx');

  beforeAll(() => {
    reader = new FacultyWorkbookReader();
  });

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('Parses dynamic staff workbook with shifted rows, blank rows, and multiple departments', async () => {
    // Generate a complex workbook dynamically for the test
    const wb = await xlsx.fromBlankAsync();
    const sheet = wb.sheet(0);
    
    // Shifted start (empty rows at top)
    sheet.cell('A5').value('DEPARTMENT: CSE');
    
    // Shifted headers
    sheet.cell('B7').value('EMPLOYEE ID');
    sheet.cell('C7').value('FACULTY NAME');
    sheet.cell('D7').value('DEPARTMENT'); // Should be ignored as context overrides
    
    // Valid data
    sheet.cell('B8').value('1001');
    sheet.cell('C8').value('John Doe');
    sheet.cell('D8').value('CSE');
    
    // Blank row
    sheet.cell('B10').value('1002');
    sheet.cell('C10').value('Jane Smith');
    
    // Second Department Block
    sheet.cell('A15').value('DEPARTMENT: ECE');
    sheet.cell('B16').value('EMPLOYEE ID');
    sheet.cell('C16').value('FACULTY NAME');
    
    sheet.cell('B17').value('002001'); // Leading zeros
    sheet.cell('C17').value('Alice ECE');
    
    await wb.toFileAsync(testFilePath);

    const records = await reader.parse(testFilePath);
    
    expect(records.length).toBe(3);
    
    expect(records[0].employeeId).toBe('1001');
    expect(records[0].facultyName).toBe('John Doe');
    expect(records[0].canonicalDepartmentCode).toBe('CSE');

    expect(records[1].employeeId).toBe('1002');
    expect(records[1].canonicalDepartmentCode).toBe('CSE');

    expect(records[2].employeeId).toBe('002001');
    expect(records[2].canonicalDepartmentCode).toBe('ECE');
  });
});
