import { LabStudentRange } from './LabStudentRangeDetector';

export interface LabVerificationReport {
    success: boolean;
    studentCount: number;
    startRow: number;
    endRow: number;
    internalMax: number;
    externalMax: number;
    thresholdPercentage: number;
    computedData?: {
        internalAttempted: number;
        internalAttained: number;
        internalPct: number;
        internal3Scale: number;
        externalAttempted: number;
        externalAttained: number;
        externalPct: number;
        external3Scale: number;
        directPct: number;
        direct3Scale: number;
    };
}

export class LabAttainmentVerifier {
    public verify(sheet: any, range: LabStudentRange, thresholdPercentage: number, meta: any): LabVerificationReport {
        const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
        const round3 = (v: number) => Math.round((v + Number.EPSILON) * 1000) / 1000;

        let intAttempted = 0, intAttained = 0;
        let extAttempted = 0, extAttained = 0;

        const intThresholdMarks = meta.internalMaxMarks * thresholdPercentage;
        const extThresholdMarks = meta.externalMaxMarks * thresholdPercentage;

        for (let r = range.startRow; r <= range.endRow; r++) {
            const intVal = sheet.cell(`D${r}`).value();
            const extVal = sheet.cell(`E${r}`).value();

            if (typeof intVal === 'number' && intVal >= 0) {
                intAttempted++;
                if (intVal >= intThresholdMarks) intAttained++;
            }
            if (typeof extVal === 'number' && extVal >= 0) {
                extAttempted++;
                if (extVal >= extThresholdMarks) extAttained++;
            }
        }

        const internalPct = intAttempted > 0 ? round2((intAttained / intAttempted) * 100) : 0;
        const externalPct = extAttempted > 0 ? round2((extAttained / extAttempted) * 100) : 0;
        const internal3Scale = intAttempted > 0 ? round2((intAttained / intAttempted) * 3) : 0;
        const external3Scale = extAttempted > 0 ? round2((extAttained / extAttempted) * 3) : 0;
        const direct3Scale = round3((0.3 * internal3Scale) + (0.7 * external3Scale));
        const directPct = round2((0.3 * internalPct) + (0.7 * externalPct));

        const report: LabVerificationReport = {
            success: true,
            studentCount: range.count,
            startRow: range.startRow,
            endRow: range.endRow,
            internalMax: meta.internalMaxMarks,
            externalMax: meta.externalMaxMarks,
            thresholdPercentage,
            computedData: {
                internalAttempted: intAttempted,
                internalAttained: intAttained,
                internalPct,
                internal3Scale,
                externalAttempted: extAttempted,
                externalAttained: extAttained,
                externalPct,
                external3Scale,
                directPct,
                direct3Scale
            }
        };

        // Check Summary table exists
        const summaryTitle = sheet.cell('H7').value();
        if (summaryTitle !== 'Lab Attainment Summary' && summaryTitle !== 'OBEMIC_LAB_ATTAINMENT_SUMMARY') {
            console.log("Verification Failed: Missing Summary title.");
            report.success = false;
        }

        // Check Direct Assessment table exists
        const directTitle = sheet.cell('L7').value();
        if (directTitle !== 'Lab CO Direct Assessment' && directTitle !== 'OBEMIC_LAB_CO_DIRECT_ASSESSMENT') {
            console.log("Verification Failed: Missing Direct Assessment title.");
            report.success = false;
        }

        // Check formulas are present in Direct Assessment
        if (!sheet.cell('O9').formula() || !sheet.cell('O13').formula()) {
            console.log("Verification Failed: Missing formulas in Direct Assessment table.");
            report.success = false;
        }

        // Check gap preservation (F and G should be blank)
        for (let r = 7; r <= 15; r++) {
            if (sheet.cell(`F${r}`).value() !== undefined || sheet.cell(`G${r}`).value() !== undefined) {
                console.log(`Verification Failed: Gap columns F or G are not blank at row ${r}.`);
                report.success = false;
            }
        }

        // Check gap column K
        for (let r = 7; r <= 15; r++) {
            if (sheet.cell(`K${r}`).value() !== undefined) {
                console.log(`Verification Failed: Gap column K is not blank at row ${r}.`);
                report.success = false;
            }
        }

        return report;
    }
}
