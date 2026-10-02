import { ExternalColumnMap } from './ExternalHeaderMapper';

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

export class ExternalAttainmentVerifier {
    public verify(
        sheet: any, 
        range: { startRow: number, endRow: number, count: number }, 
        courseOutcomes: { coCode: string }[], 
        threshold: number,
        colMap: ExternalColumnMap,
        startColIndex: number
    ): VerificationReport {
        
        const summaryStartRow = range.endRow + 2;

        const report: VerificationReport = {
            subjectName: sheet.name(),
            studentCount: range.count,
            startRow: range.startRow,
            endRow: range.endRow,
            summaryStartRow,
            threshold,
            firstStudentFormulas: {},
            lastStudentFormulas: {},
            success: true,
            computedData: {} // Initialize
        };

        // Extract first and last student formulas to verify they exist
        courseOutcomes.forEach((co, idx) => {
            const colIndex = startColIndex + idx;
            report.firstStudentFormulas[co.coCode] = sheet.cell(range.startRow, colIndex).formula() || '';
            report.lastStudentFormulas[co.coCode] = sheet.cell(range.endRow, colIndex).formula() || '';

            // COMPUTE MANUAL DATA
            let appeared = 0;
            let attained = 0;
            const coMap = colMap.cos[co.coCode.toUpperCase()];

            for (let r = range.startRow; r <= range.endRow; r++) {
               const aVal = sheet.cell(`${coMap.partA_a}${r}`).value();
               const bVal = sheet.cell(`${coMap.partA_b}${r}`).value();
               const p1Val = sheet.cell(`${coMap.partB_1}${r}`).value();
               const p2Val = sheet.cell(`${coMap.partB_2}${r}`).value();

               if (String(aVal).trim().toUpperCase() === 'AB') {
                  continue;
               }

               const a = Number(aVal) || 0;
               const b = Number(bVal) || 0;
               const p1 = Number(p1Val) || 0;
               const p2 = Number(p2Val) || 0;

               const math = ((((a + b) / 2) + Math.max(p1, p2)) / 14) * 3;
               const num = Math.round(math * 100) / 100;

               appeared++;
               if (num >= threshold) {
                  attained++;
               }
            }
            const pct = appeared > 0 ? (attained / appeared) * 100 : 0;
            let scale3 = (pct / 100) * 3;

            report.computedData![co.coCode] = { pct, scale3 };
        });

        // Basic verification
        courseOutcomes.forEach(co => {
            if (!report.firstStudentFormulas[co.coCode] || !report.lastStudentFormulas[co.coCode]) {
                console.log(`Failed basic verification: Missing first or last formula for ${co.coCode}`);
                report.success = false;
            }
        });

        return report;
    }
}
