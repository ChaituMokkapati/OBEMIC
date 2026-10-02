// @ts-ignore
import xlsx from 'xlsx-populate';
import { resolveDepartmentCodeByAlias } from '../../../../config/branch-codes';

export interface RawFacultyRecord {
  employeeId: string;
  facultyName: string;
  departmentRaw: string | null;
  canonicalDepartmentCode: string | null;
  worksheetName: string;
  rowIndex: number;
}

export class FacultyWorkbookReader {
  public async parse(filePath: string): Promise<RawFacultyRecord[]> {
    const workbook = await xlsx.fromFileAsync(filePath);
    const records: RawFacultyRecord[] = [];

    for (const sheet of workbook.sheets()) {
      const usedRange = sheet.usedRange();
      if (!usedRange) continue;
      
      const rows = usedRange.value();
      if (!rows) continue;

      let currentDepartmentContext: string | null = null;
      let headerRowIndex = -1;
      let employeeIdColIndex = -1;
      let nameColIndex = -1;
      let departmentColIndex = -1;

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        
        // Scan for department context blocks (e.g., "Department: CSE" or just "CSE")
        for (let c = 0; c < row.length; c++) {
          const val = row[c];
          if (typeof val === 'string') {
            const trimmed = val.trim().toUpperCase();
            if (trimmed.startsWith('DEPARTMENT:')) {
              currentDepartmentContext = val.replace(/department:/i, '').trim();
            } else if (trimmed === 'DEPARTMENT' && typeof row[c+1] === 'string' && row[c+1].trim()) {
              currentDepartmentContext = row[c+1].trim();
            } else if (['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'].includes(trimmed)) {
              // Found a standalone department code cell
              currentDepartmentContext = trimmed;
            }
          }
        }

        // If headers not yet found, try to find them in this row
        if (headerRowIndex === -1) {
          for (let c = 0; c < row.length; c++) {
            const val = row[c];
            if (typeof val === 'string') {
              const normalizedHeader = val.trim().toUpperCase();
              if (normalizedHeader.includes('EMPLOYEE ID') || normalizedHeader === 'ID' || normalizedHeader === 'EMP ID' || normalizedHeader.includes('EMP. NO') || normalizedHeader.includes('EMP NO')) {
                employeeIdColIndex = c;
              }
              if (normalizedHeader.includes('FACULTY NAME') || normalizedHeader === 'NAME' || normalizedHeader.includes('NAME OF THE FACULTY')) {
                nameColIndex = c;
              }
              if (normalizedHeader === 'DEPARTMENT' || normalizedHeader === 'BRANCH') {
                departmentColIndex = c;
              }
            }
          }
          
          if (employeeIdColIndex !== -1 && nameColIndex !== -1) {
            headerRowIndex = r;
            continue; // Move to next row to start reading data
          }
        }

        // Read data if headers were found and this is past the header row
        if (headerRowIndex !== -1 && r > headerRowIndex) {
          const rawId = row[employeeIdColIndex];
          const rawName = row[nameColIndex];
          
          if (rawId && rawName) {
            // Preserve leading zeros by casting to string immediately
            const employeeIdStr = String(rawId).trim();
            const facultyNameStr = String(rawName).trim();
            
            // Prefer inline department if it exists, fallback to block context
            let rowDept = currentDepartmentContext;
            if (departmentColIndex !== -1 && row[departmentColIndex]) {
              rowDept = String(row[departmentColIndex]).trim();
            }

            // Resolve using centralized config
            const deptConfig = rowDept ? resolveDepartmentCodeByAlias(rowDept) : null;
            
            if (employeeIdStr) {
              records.push({
                employeeId: employeeIdStr,
                facultyName: facultyNameStr,
                departmentRaw: rowDept,
                canonicalDepartmentCode: deptConfig ? deptConfig.departmentCode : null,
                worksheetName: sheet.name(),
                rowIndex: r + 1
              });
            }
          } else if (!rawId && !rawName) {
            // Empty row, we reset headers so we can find new blocks if they exist.
            // Or we just continue; wait, faculty lists might have blank rows. We'll just continue.
          }
        }
      }
    }

    return records;
  }
}
