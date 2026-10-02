const XlsxPopulate = require('xlsx-populate');
import { LabWorkbookValidator, LabWorkbookMeta } from './LabWorkbookValidator';
import { LabStudentRangeDetector } from './LabStudentRangeDetector';
import { LabMarksNormalizer } from './LabMarksNormalizer';
import { LabSummaryWriter } from './LabSummaryWriter';
import { LabDirectAssessmentWriter } from './LabDirectAssessmentWriter';
import { LabAttainmentVerifier, LabVerificationReport } from './LabAttainmentVerifier';

export class LabAttainmentService {
    private validator = new LabWorkbookValidator();
    private rangeDetector = new LabStudentRangeDetector();
    private marksNormalizer = new LabMarksNormalizer();
    private summaryWriter = new LabSummaryWriter();
    private directAssessmentWriter = new LabDirectAssessmentWriter();
    private verifier = new LabAttainmentVerifier();

    public async generateAttainment(workbookBuffer: Buffer, sheetName?: string, thresholdPercentage: number = 0.60): Promise<{ outputBuffer: Buffer, report: LabVerificationReport, students: Array<{ rollNumber: string, name: string }> }> {
        // 1. Load Workbook
        const wb = await XlsxPopulate.fromDataAsync(workbookBuffer);
        const sheet = sheetName ? wb.sheet(sheetName) : wb.sheet(0);
        
        // 2. Validate Workbook & Detect Max Marks
        const meta = this.validator.validate(sheet);

        // 3. Detect Range
        const range = this.rangeDetector.detect(sheet);

        // 4. Normalize AB Values and Validate Marks
        this.marksNormalizer.normalizeAndValidate(sheet, range, meta);

        // 5. Clear Old Engine Regions safely
        this.summaryWriter.clear(sheet);
        this.directAssessmentWriter.clear(sheet);

        // 6. Generate Summary Formulas
        this.summaryWriter.write(sheet, range, meta, thresholdPercentage);

        // 7. Generate Direct Assessment Formulas
        this.directAssessmentWriter.write(sheet);

        // 8. Verify
        const report = this.verifier.verify(sheet, range, thresholdPercentage, meta);

        if (!report.success) {
            throw new Error("Verification failed after generating Lab Attainment.");
        }

        // 9. Extract Students for DB Synchronization
        const students: Array<{ rollNumber: string, name: string }> = [];
        for (let r = range.startRow; r <= range.endRow; r++) {
            const rollNumber = String(sheet.cell(`B${r}`).value() || '').trim();
            const name = String(sheet.cell(`C${r}`).value() || rollNumber).trim();
            if (rollNumber) {
                students.push({ rollNumber, name });
            }
        }

        // 10. Output
        const outputBuffer = await wb.outputAsync();

        return { outputBuffer, report, students };
    }
}
