import { LabFormulaBuilder } from './LabFormulaBuilder';
import { LabTableStyle } from './LabTableStyle';

export class LabDirectAssessmentWriter {
    private builder = new LabFormulaBuilder();

    public write(sheet: any): void {
        const titleRow = 7;
        const headerRow = 8;
        
        // 1. Write Title
        const titleRange = sheet.range(`L${titleRow}:O${titleRow}`);
        titleRange.merged(true);
        titleRange.value('OBEMIC_LAB_CO_DIRECT_ASSESSMENT'); // Marker
        titleRange.value('Lab CO Direct Assessment');
        LabTableStyle.applyTitleStyle(titleRange);

        // 2. Write Headers
        const headers = ['Course Outcome', 'Internal', 'External', 'Direct Assessment'];
        const cols = ['L', 'M', 'N', 'O'];
        
        for (let i = 0; i < 4; i++) {
            const cell = sheet.cell(`${cols[i]}${headerRow}`);
            cell.value(headers[i]);
            LabTableStyle.applyHeaderStyle(cell);
        }

        // Apply widths
        LabTableStyle.setColumnWidths(sheet, ['L'], 18);
        LabTableStyle.setColumnWidths(sheet, ['M', 'N'], 12);
        LabTableStyle.setColumnWidths(sheet, ['O'], 20);

        // 3. Write Data Rows
        const dataStart = 9;
        
        // Reference cells from Summary Table (Row 12 holds 3-Point Attainment)
        const summaryInternal3PointCell = `I12`;
        const summaryExternal3PointCell = `J12`;

        for (let i = 0; i < 5; i++) {
            const r = dataStart + i;
            
            // CO Name
            sheet.cell(`L${r}`).value(`CO${i + 1}`);

            // Internal
            sheet.cell(`M${r}`).formula(`=${summaryInternal3PointCell}`);
            
            // External
            sheet.cell(`N${r}`).formula(`=${summaryExternal3PointCell}`);

            // Direct Assessment
            sheet.cell(`O${r}`).formula(this.builder.getDirectAssessmentFormula(`M${r}`, `N${r}`));
        }

        // 4. Apply Styles
        const dataRange = sheet.range(`L${dataStart}:O${dataStart + 4}`);
        LabTableStyle.applyDataStyle(dataRange);
        
        // Format values
        LabTableStyle.applyNumericFormat(sheet.range(`M${dataStart}:N${dataStart + 4}`), '0.00');
        LabTableStyle.applyNumericFormat(sheet.range(`O${dataStart}:O${dataStart + 4}`), '0.000');
    }

    public clear(sheet: any): void {
        const titleRow = 7;
        const markerCell = sheet.cell(`L${titleRow}`).value();
        
        if (markerCell === 'Lab CO Direct Assessment' || markerCell === 'OBEMIC_LAB_CO_DIRECT_ASSESSMENT') {
            const titleRange = sheet.range(`L${titleRow}:O${titleRow}`);
            if (titleRange.merged()) {
                titleRange.merged(false);
            }
            
            // Clear exactly 7 rows (Title, Header, 5 Data rows)
            for (let r = titleRow; r <= titleRow + 6; r++) {
                for (let c = 12; c <= 15; c++) { // L=12, O=15
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
