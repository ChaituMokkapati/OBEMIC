import { StudentRange } from '../shared/DynamicStudentRangeDetector';
import { InternalColumnMap } from './InternalHeaderMapper';
import { TablePlacementService } from '../shared/TablePlacementService';

export interface VerificationReport {
    subjectName: string;
    studentCount: number;
    startRow: number;
    endRow: number;
    summaryStartRow: number;
    threshold: number;
    firstStudentFormulas: Record<string, string>;
    lastStudentFormulas: Record<string, string>;
    success: boolean;
    computedData?: Record<string, { pct: number, scale3: number }>;
}

export class InternalAttainmentVerifier {
    private placement = new TablePlacementService();

    public verify(sheet: any, range: StudentRange, courseOutcomes: { coCode: string }[], threshold: number, colMap: InternalColumnMap, startColIndex: number): VerificationReport {
        const numCOs = courseOutcomes.length;
        
        const cols: string[] = [];
        for (let i = 0; i < numCOs; i++) {
            cols.push(this.placement.getColLetter(startColIndex + i));
        }
        const firstCol = cols.length > 0 ? cols[0] : '';
        
        const firstStudentFormulas: Record<string, string> = {};
        const lastStudentFormulas: Record<string, string> = {};
        const computedData: Record<string, { pct: number, scale3: number }> = {};

        for (let i = 0; i < numCOs; i++) {
            const co = courseOutcomes[i].coCode;
            const colIdx = startColIndex + i;
            firstStudentFormulas[co] = sheet.cell(`${cols[i]}${range.startRow}`).formula();
            lastStudentFormulas[co] = sheet.cell(`${cols[i]}${range.endRow}`).formula();

            // COMPUTE MANUAL DATA
            let appeared = 0;
            let attained = 0;

            for (let r = range.startRow; r <= range.endRow; r++) {
               let valStr = '';
               let math = 0;

               const getVal = (colStr: string) => {
                  const cellVal = sheet.cell(`${colStr}${r}`).value();
                  return String(cellVal).trim().toUpperCase();
               };
               const getNum = (colStr: string) => {
                  const cellVal = sheet.cell(`${colStr}${r}`).value();
                  if (String(cellVal).trim().toUpperCase() === 'AB') return NaN;
                  return Number(cellVal) || 0;
               };

               try {
                   if (co === 'CO1') {
                       const q1 = getNum(colMap.mid1.q1); const q2 = getNum(colMap.mid1.q2); const obj = getNum(colMap.mid1.objective);
                       if (isNaN(q1) && isNaN(q2) && isNaN(obj)) throw new Error('AB');
                       math = ((Math.max(q1||0, q2||0) + (obj||0)) / 20) * 3;
                   } else if (co === 'CO2') {
                       const q3 = getNum(colMap.mid1.q3); const q4 = getNum(colMap.mid1.q4); const obj = getNum(colMap.mid1.objective);
                       if (isNaN(q3) && isNaN(q4) && isNaN(obj)) throw new Error('AB');
                       math = ((Math.max(q3||0, q4||0) + (obj||0)) / 20) * 3;
                   } else if (co === 'CO3') {
                       const q5 = getNum(colMap.mid1.q5); const q6 = getNum(colMap.mid1.q6); const obj1 = getNum(colMap.mid1.objective);
                       const q1 = getNum(colMap.mid2.q1); const q2 = getNum(colMap.mid2.q2); const obj2 = getNum(colMap.mid2.objective);
                       if (isNaN(q5) && isNaN(q1)) throw new Error('AB');
                       math = ((Math.max(q5||0, q6||0) + (obj1||0) + Math.max(q1||0, q2||0) + (obj2||0)) / 40) * 3;
                   } else if (co === 'CO4') {
                       const q3 = getNum(colMap.mid2.q3); const q4 = getNum(colMap.mid2.q4); const obj = getNum(colMap.mid2.objective);
                       if (isNaN(q3) && isNaN(q4) && isNaN(obj)) throw new Error('AB');
                       math = ((Math.max(q3||0, q4||0) + (obj||0)) / 20) * 3;
                   } else if (co === 'CO5') {
                       const q5 = getNum(colMap.mid2.q5); const q6 = getNum(colMap.mid2.q6); const obj = getNum(colMap.mid2.objective);
                       if (isNaN(q5) && isNaN(q6) && isNaN(obj)) throw new Error('AB');
                       math = ((Math.max(q5||0, q6||0) + (obj||0)) / 20) * 3;
                   }

                   const num = Math.round(math * 100) / 100;
                   appeared++;
                   if (num >= threshold) {
                      attained++;
                   }
               } catch (e) {
                   // Student absent, ignore
               }
            }
            
            const pct = appeared > 0 ? (attained / appeared) * 100 : 0;
            let scale3 = (pct / 100) * 3;
            
            computedData[co] = { pct, scale3 };
        }

        const report: VerificationReport = {
            subjectName: sheet.name(),
            studentCount: range.count,
            startRow: range.startRow,
            endRow: range.endRow,
            summaryStartRow: range.endRow + 2,
            threshold,
            firstStudentFormulas,
            lastStudentFormulas,
            success: true,
            computedData
        };

        // Basic verification
        if (numCOs > 0) {
            const firstCO = courseOutcomes[0].coCode;
            const lastCO = courseOutcomes[numCOs - 1].coCode;
            if (!report.firstStudentFormulas[firstCO] || !report.lastStudentFormulas[lastCO]) {
                console.log("Failed basic verification: Missing first or last formula");
                console.log(report.firstStudentFormulas);
                console.log(report.lastStudentFormulas);
                report.success = false;
            }
        }

        // Verify no formula below last student in the first output column (unless it's the summary table)
        if (firstCol) {
            const gapCell = sheet.cell(`${firstCol}${range.endRow + 1}`).value();
            if (gapCell !== undefined && gapCell !== null && gapCell !== '') {
                console.log("Failed gap verification: Gap cell is not empty", gapCell, "Range was", range);
                report.success = false;
            }
        }

        return report;
    }
}
