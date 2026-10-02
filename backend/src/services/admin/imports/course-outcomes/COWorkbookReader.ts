// @ts-ignore
import xlsx from 'xlsx-populate';
import { SubjectCodeParser, ParsedSubjectCode } from '../../../academic/SubjectCodeParser';

export interface RawCORecord {
  coCode: string;
  description: string;
  poMatrix?: Record<string, number>;
}

export interface RawSubjectBlock {
  workbookDepartment: string | null;
  workbookRegulation: string | null;
  workbookSemester: string | null;
  parsedSubjectCode: ParsedSubjectCode;
  subjectName: string | null;
  courseOutcomes: RawCORecord[];
  worksheetName: string;
}

export class COWorkbookReader {
  public async parse(filePath: string): Promise<RawSubjectBlock[]> {
    const workbook = await xlsx.fromFileAsync(filePath);
    const subjectBlocks: RawSubjectBlock[] = [];

    for (const sheet of workbook.sheets()) {
      const usedRange = sheet.usedRange();
      if (!usedRange) continue;
      
      const rows = usedRange.value();
      if (!rows) continue;

      let currentDept: string | null = null;
      let currentReg: string | null = null;
      let currentSem: string | null = null;
      
      let currentSubject: RawSubjectBlock | null = null;

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        
        for (let c = 0; c < row.length; c++) {
          const val = row[c];
          if (typeof val === 'string') {
            const trimmed = val.trim().toUpperCase();
            
            // Context Detectors
            if (trimmed.startsWith('DEPARTMENT:')) {
              currentDept = val.replace(/department:/i, '').trim();
            }
            if (trimmed.startsWith('REGULATION:')) {
              currentReg = val.replace(/regulation:/i, '').trim();
            }
            if (trimmed.includes('SEMESTER')) {
              currentSem = val.trim();
            }

            // Detect Subject Code (either next to 'SUBJECT CODE' or naked in the cell)
            let possibleSubjectCodeStr: string | null = null;
            let possibleSubjectName: string | null = null;
            
            if (trimmed.includes('SUBJECT CODE')) {
              for (let nextC = c + 1; nextC < row.length; nextC++) {
                if (typeof row[nextC] === 'string' && row[nextC].trim()) {
                  possibleSubjectCodeStr = row[nextC].trim();
                  break;
                }
              }
            } else {
              // Try the cell itself
              possibleSubjectCodeStr = val.trim();
              if (c + 1 < row.length && typeof row[c+1] === 'string') {
                 possibleSubjectName = row[c+1].trim();
              }
            }

            if (possibleSubjectCodeStr) {
               try {
                 const parsedCode = SubjectCodeParser.parse(possibleSubjectCodeStr);
                 
                 // If we get here, it's a valid subject code!
                 if (currentSubject) {
                   subjectBlocks.push(currentSubject);
                 }
                 
                 currentSubject = {
                   workbookDepartment: currentDept,
                   workbookRegulation: currentReg,
                   workbookSemester: currentSem,
                   parsedSubjectCode: parsedCode,
                   subjectName: possibleSubjectName, // Best effort from next cell
                   courseOutcomes: [],
                   worksheetName: sheet.name()
                 };
               } catch (e) {
                 // Not a valid subject code
               }
            }
            
            // Subject Name (heuristic: "SUBJECT NAME" header) - this overrides the best effort if found
            if (trimmed.includes('SUBJECT NAME') && currentSubject) {
               for (let nextC = c + 1; nextC < row.length; nextC++) {
                 if (typeof row[nextC] === 'string' && row[nextC].trim()) {
                    currentSubject.subjectName = row[nextC].trim();
                    break;
                 }
               }
            }

            // Detect CO Rows
            // Normalizing CO codes: CO1, CO 1, Co1 -> CO1
            const coMatch = trimmed.match(/^CO\s*(\d)$/i);
            if (coMatch && currentSubject) {
              const coNumber = coMatch[1];
              // Description is usually next to it
              for (let nextC = c + 1; nextC < row.length; nextC++) {
                 if (typeof row[nextC] === 'string' && row[nextC].trim()) {
                    const poMatrix: Record<string, number> = {};
                    for (let i = 1; i <= 12; i++) {
                       const poVal = row[nextC + i];
                       if (poVal !== undefined && poVal !== null && poVal !== '') {
                          const num = Number(poVal);
                          if (!isNaN(num) && num >= 1 && num <= 3) {
                             poMatrix[`PO${i}`] = num;
                          }
                       }
                    }
                    
                    // Capture PSOs (PSO1 is usually offset 13, PSO2 is offset 14)
                    for (let i = 1; i <= 2; i++) {
                       const psoVal = row[nextC + 12 + i];
                       if (psoVal !== undefined && psoVal !== null && psoVal !== '') {
                          const num = Number(psoVal);
                          if (!isNaN(num) && num >= 1 && num <= 3) {
                             poMatrix[`PSO${i}`] = num;
                          }
                       }
                    }

                    currentSubject.courseOutcomes.push({
                      coCode: `CO${coNumber}`,
                      description: row[nextC].trim(),
                      poMatrix
                    });
                    break;
                 }
              }
            }
          }
        }
      }
      
      if (currentSubject) {
        subjectBlocks.push(currentSubject);
      }
    }

    return subjectBlocks;
  }
}
