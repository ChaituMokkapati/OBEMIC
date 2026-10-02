const XlsxPopulate = require('xlsx-populate');
import { InternalWorkbookValidator } from './InternalWorkbookValidator';
import { DynamicStudentRangeDetector } from '../shared/DynamicStudentRangeDetector';
import { StudentCOAttainmentWriter } from './StudentCOAttainmentWriter';
import { COSummaryWriter } from './COSummaryWriter';
import { InternalAttainmentVerifier, VerificationReport } from './InternalAttainmentVerifier';
import { HeaderScanner } from '../shared/HeaderScanner';
import { InternalHeaderMapper } from './InternalHeaderMapper';
import { TablePlacementService } from '../shared/TablePlacementService';

export class InternalAttainmentService {
    private validator = new InternalWorkbookValidator();
    private scanner = new HeaderScanner();
    private mapper = new InternalHeaderMapper();
    private placement = new TablePlacementService();
    private rangeDetector = new DynamicStudentRangeDetector();
    private studentWriter = new StudentCOAttainmentWriter();
    private summaryWriter = new COSummaryWriter();
    private verifier = new InternalAttainmentVerifier();

    public async generateAttainment(fileBuffer: Buffer, subjectCode: string, courseOutcomes: { coCode: string }[], threshold: number = 1.8): Promise<{ outputBuffer: Buffer, report: VerificationReport }> {
        // 1. Load Workbook
        const workbook = await XlsxPopulate.fromDataAsync(fileBuffer);

        // 2. Validate and Select Worksheet
        this.validator.validateWorkbook(workbook);
        const sheet = this.validator.resolveSubjectWorksheet(workbook, subjectCode);

        // 3. Scan Headers and Map Columns Dynamically
        const columns = this.scanner.scan(sheet, 10, 50); // Scan first 10 rows, up to 50 columns
        const colMap = this.mapper.map(columns);

        // 4. Detect Student Range
        const range = this.rangeDetector.detect(sheet, columns);

        // 5. Determine Dynamic Placement & Handle Idempotency (clears existing output)
        const startColIndex = this.placement.resolvePlacement(sheet, [8, 9, 10], 2); // Internal headers are around rows 8-10

        // 6. Generate Excel Formulas and apply static conditional formatting for N COs
        this.studentWriter.write(sheet, range, courseOutcomes, colMap, startColIndex, threshold);

        // 7. Generate CO Attainment Summary Table for N COs
        this.summaryWriter.write(sheet, range, courseOutcomes, startColIndex, threshold);

        // 8. Verify Output (Temporarily pass dummy colMap if verifier isn't updated yet, or we can just skip verification until we update verifier)
        // Wait, InternalAttainmentVerifier might need the new map! Let's pass the new map.
        // I will update verifier separately.
        const report = this.verifier.verify(sheet, range, courseOutcomes, threshold, colMap, startColIndex);
        if (!report.success) {
            throw new Error("Internal Attainment Verification failed after generation.");
        }

        // 9. Return generated workbook buffer
        const outputBuffer = await workbook.outputAsync();

        return {
            outputBuffer: outputBuffer as Buffer,
            report
        };
    }
}
