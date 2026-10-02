import { LabFormulaBuilder } from './LabFormulaBuilder';
import { LabStudentRange } from './LabStudentRangeDetector';
import { LabTableStyle } from './LabTableStyle';
import { LabWorkbookMeta } from './LabWorkbookValidator';

export class LabSummaryWriter {
    private builder = new LabFormulaBuilder();

    public write(sheet: any, range: LabStudentRange, meta: LabWorkbookMeta, thresholdPercentage: number = 0.60): void {
        const titleRow = 7;
        const headerRow = 8;
        
        // 1. Write Title
        const titleRange = sheet.range(`H${titleRow}:J${titleRow}`);
        titleRange.merged(true);
        titleRange.value('OBEMIC_LAB_ATTAINMENT_SUMMARY'); // Marker
        titleRange.value('Lab Attainment Summary');
        LabTableStyle.applyTitleStyle(titleRange);

        // 2. Write Headers
        const headers = ['Metric', 'Internal', 'External'];
        const cols = ['H', 'I', 'J'];
        
        for (let i = 0; i < 3; i++) {
            const cell = sheet.cell(`${cols[i]}${headerRow}`);
            cell.value(headers[i]);
            LabTableStyle.applyHeaderStyle(cell);
        }

        // Apply widths
        LabTableStyle.setColumnWidths(sheet, ['H'], 45);
        LabTableStyle.setColumnWidths(sheet, ['I', 'J'], 15);

        // 3. Write Data Rows
        const dataStart = 9;
        const thresholdPercentStr = Math.round(thresholdPercentage * 100) + '%';
        
        // Row 9: Attempted
        sheet.cell(`H${dataStart}`).value('Number of Students Attempted');
        sheet.cell(`I${dataStart}`).formula(this.builder.getAttemptedFormula('D', range.startRow, range.endRow));
        sheet.cell(`J${dataStart}`).formula(this.builder.getAttemptedFormula('E', range.startRow, range.endRow));
        
        // Row 10: Attained
        const intThresholdMarks = meta.internalMaxMarks * thresholdPercentage;
        const extThresholdMarks = meta.externalMaxMarks * thresholdPercentage;
        sheet.cell(`H${dataStart + 1}`).value(`Number of Students who got at least ${thresholdPercentStr} of marks`);
        sheet.cell(`I${dataStart + 1}`).formula(this.builder.getAttainedFormula('D', range.startRow, range.endRow, intThresholdMarks));
        sheet.cell(`J${dataStart + 1}`).formula(this.builder.getAttainedFormula('E', range.startRow, range.endRow, extThresholdMarks));
        
        // Row 11: Percentage
        sheet.cell(`H${dataStart + 2}`).value(`Percentage of Students who got at least ${thresholdPercentStr} of marks`);
        sheet.cell(`I${dataStart + 2}`).formula(this.builder.getPercentageFormula(`I${dataStart + 1}`, `I${dataStart}`));
        sheet.cell(`J${dataStart + 2}`).formula(this.builder.getPercentageFormula(`J${dataStart + 1}`, `J${dataStart}`));
        
        // Row 12: 3-Point
        sheet.cell(`H${dataStart + 3}`).value('3-Point Attainment');
        sheet.cell(`I${dataStart + 3}`).formula(this.builder.get3PointAttainmentFormula(`I${dataStart + 1}`, `I${dataStart}`));
        sheet.cell(`J${dataStart + 3}`).formula(this.builder.get3PointAttainmentFormula(`J${dataStart + 1}`, `J${dataStart}`));

        // 4. Apply Styles
        const dataRange = sheet.range(`H${dataStart}:J${dataStart + 3}`);
        LabTableStyle.applyDataStyle(dataRange);
        
        // Metric column should not be centered, left aligned is better for readability
        sheet.range(`H${dataStart}:H${dataStart + 3}`).style('horizontalAlignment', 'left');
        
        // Format percentages
        LabTableStyle.applyNumericFormat(sheet.range(`I${dataStart + 2}:J${dataStart + 2}`), '0.00%');
        
        // Format 3-point
        LabTableStyle.applyNumericFormat(sheet.range(`I${dataStart + 3}:J${dataStart + 3}`), '0.00');
    }

    public clear(sheet: any): void {
        const titleRow = 7;
        const markerCell = sheet.cell(`H${titleRow}`).value();
        
        if (markerCell === 'Lab Attainment Summary' || markerCell === 'OBEMIC_LAB_ATTAINMENT_SUMMARY') {
            const titleRange = sheet.range(`H${titleRow}:J${titleRow}`);
            if (titleRange.merged()) {
                titleRange.merged(false);
            }
            
            // Clear exactly 6 rows (Title, Header, 4 Data rows)
            for (let r = titleRow; r <= titleRow + 5; r++) {
                for (let c = 8; c <= 10; c++) { // H=8, J=10
                    const cell = sheet.cell(r, c);
                    cell.formula(undefined);
                    cell.value(undefined);
                    cell.style('border', undefined);
                    cell.style('fill', undefined);
                    cell.style('numberFormat', undefined);
                    cell.style('horizontalAlignment', undefined);
                    cell.style('verticalAlignment', undefined);
                    cell.style('bold', undefined);
                }
            }
        }
    }
}
