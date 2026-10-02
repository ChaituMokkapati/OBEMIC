const XlsxPopulate = require('xlsx-populate');
import { ExternalWorkbookValidator } from './ExternalWorkbookValidator';
import { DynamicStudentRangeDetector } from '../shared/DynamicStudentRangeDetector';
import { ExternalCOAttainmentWriter } from './ExternalCOAttainmentWriter';
import { ExternalCOSummaryWriter } from './ExternalCOSummaryWriter';
import { ExternalAttainmentVerifier, VerificationReport } from './ExternalAttainmentVerifier';
import { HeaderScanner } from '../shared/HeaderScanner';
import { ExternalHeaderMapper } from './ExternalHeaderMapper';
import { TablePlacementService } from '../shared/TablePlacementService';

export class ExternalAttainmentService {
    private validator = new ExternalWorkbookValidator();
    private scanner = new HeaderScanner();
    private mapper = new ExternalHeaderMapper();
    private placement = new TablePlacementService();
    private rangeDetector = new DynamicStudentRangeDetector();
    private studentWriter = new ExternalCOAttainmentWriter();
    private summaryWriter = new ExternalCOSummaryWriter();
    private verifier = new ExternalAttainmentVerifier();

    public async generateAttainment(fileBuffer: Buffer, subjectCode: string, courseOutcomes: { coCode: string }[], threshold: number = 1.8): Promise<{ outputBuffer: Buffer, report: VerificationReport, students: { rollNumber: string, name: string }[] }> {
        // 1. Load Workbook
        const workbook = await XlsxPopulate.fromDataAsync(fileBuffer);

        // 2. Validate and Select Worksheet
        this.validator.validateWorkbook(workbook);
        const sheet = this.validator.resolveSubjectWorksheet(workbook, subjectCode);

        // 3. Scan Headers and Map Columns Dynamically
        const columns = this.scanner.scan(sheet, 10, 50); // Scan first 10 rows, up to 50 columns
        const colMap = this.mapper.map(columns, courseOutcomes);

        // 4. Detect Student Range
        const range = this.rangeDetector.detect(sheet, columns);
        
        // Extract Students
        const students: { rollNumber: string, name: string }[] = [];
        for (let r = range.startRow; r <= range.endRow; r++) {
            const roll = sheet.cell(`${range.studentIdColLetter}${r}`).value();
            let name = '';
            if (range.studentNameColLetter) {
                name = sheet.cell(`${range.studentNameColLetter}${r}`).value() || '';
            }
            if (roll && String(roll).trim()) {
                students.push({ rollNumber: String(roll).trim(), name: String(name).trim() });
            }
        }

        // 5. Validation: Ensure no mixture of 'AB' and numbers for any student
        this.validateAbsenceData(sheet, range, colMap);

        // 6. Determine Dynamic Placement & Handle Idempotency (clears existing output)
        // External headers are usually around rows 2-4
        const startColIndex = this.placement.resolvePlacement(sheet, [2, 3, 4], 2); 

        // 7. Generate External CO Attainment
        const bounds = this.studentWriter.write(sheet, range, courseOutcomes, colMap, startColIndex, threshold);
        
        // 8. Generate Summary Table
        this.summaryWriter.write(sheet, range, courseOutcomes, bounds, threshold);

        // 9. Verify Output
        const report = this.verifier.verify(sheet, range, courseOutcomes, threshold, colMap, startColIndex);
        if (!report.success) {
            throw new Error("External Attainment Verification failed after generation.");
        }

        // 10. Return generated workbook buffer
        const outputBuffer = await workbook.outputAsync();

        return {
            outputBuffer: outputBuffer as Buffer,
            report,
            students
        };
    }

    private validateAbsenceData(sheet: any, range: { startRow: number, endRow: number }, colMap: any) {
        // Extract all column letters mapped in colMap
        const colsToCheck: string[] = [];
        for (const co of Object.values(colMap.cos) as any[]) {
            if (co.partA_a) colsToCheck.push(co.partA_a);
            if (co.partA_b) colsToCheck.push(co.partA_b);
            if (co.partB_1) colsToCheck.push(co.partB_1);
            if (co.partB_2) colsToCheck.push(co.partB_2);
        }
        const uniqueCols = Array.from(new Set(colsToCheck));

        for (let r = range.startRow; r <= range.endRow; r++) {
            let hasAB = false;
            let hasNumber = false;

            for (const col of uniqueCols) {
                const val = sheet.cell(`${col}${r}`).value();
                if (val === undefined || val === null) continue; // Blank cells are ignored (or treated as 0)

                const strVal = String(val).trim().toUpperCase();
                if (strVal === 'AB') {
                    hasAB = true;
                } else if (!isNaN(Number(strVal)) && strVal !== '') {
                    hasNumber = true;
                }
            }

            if (hasAB && hasNumber) {
                throw new Error(`INVALID_EXTERNAL_MARKS_DATA: Impossible mixture of numbers and 'AB' found for student at row ${r}. A student must be fully absent ('AB') or have marks.`);
            }
        }
    }
}
