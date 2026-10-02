import { InternalFormulaBuilder } from './InternalFormulaBuilder';
import { StudentRange } from '../shared/DynamicStudentRangeDetector';
import { TablePlacementService } from '../shared/TablePlacementService';

export class COSummaryWriter {
    private builder = new InternalFormulaBuilder();
    private placement = new TablePlacementService();

    public write(sheet: any, range: StudentRange, courseOutcomes: { coCode: string }[], startColIndex: number, threshold: number): void {
        const numCOs = courseOutcomes.length;
        if (numCOs > 5) {
            throw new Error(`The internal template currently only supports up to 5 COs. Found: ${numCOs}`);
        }
        const summaryStartRow = range.endRow + 2;

        // The summary table always requires 5 columns for its layout
        const cols: string[] = [];
        for (let i = 0; i < 5; i++) {
            cols.push(this.placement.getColLetter(startColIndex + i));
        }
        
        const firstCol = cols[0];
        const lastCol = cols[4];

        // 1. Write Headers
        const summaryHeaders = ['CO', 'Appeared', 'Attained', '3-Point Scale', 'Attainment Percentage'];
        
        for (let i = 0; i < 5; i++) {
            const cell = sheet.cell(`${cols[i]}${summaryStartRow}`);
            cell.value(summaryHeaders[i]);
            cell.style('bold', true);
            cell.style('horizontalAlignment', 'center');
            cell.style('fill', 'C6E0B4'); // Light green background
        }

        // 2. Write Data Rows
        for (let i = 0; i < numCOs; i++) {
            const r = summaryStartRow + i + 1;
            
            // CO Name
            sheet.cell(`${cols[0]}${r}`).value(courseOutcomes[i].coCode);

            // Appeared 
            sheet.cell(`${cols[1]}${r}`).formula(this.builder.getAppearedFormula(cols[i], range.startRow, range.endRow));
            
            // Attained 
            sheet.cell(`${cols[2]}${r}`).formula(this.builder.getAttainedFormula(cols[i], range.startRow, range.endRow, threshold));

            // 3-Point Scale 
            sheet.cell(`${cols[3]}${r}`).formula(this.builder.get3PointScaleFormula(`${cols[2]}${r}`, `${cols[1]}${r}`));

            // Attainment Percentage 
            sheet.cell(`${cols[4]}${r}`).formula(this.builder.getAttainmentPercentageFormula(`${cols[2]}${r}`, `${cols[1]}${r}`));
        }

        // 3. Add formatting (borders and alignment)
        sheet.range(`${firstCol}${summaryStartRow}:${lastCol}${summaryStartRow + numCOs}`).style('border', true);
        sheet.range(`${firstCol}${summaryStartRow + 1}:${lastCol}${summaryStartRow + numCOs}`).style('horizontalAlignment', 'center');
        sheet.range(`${firstCol}${summaryStartRow + 1}:${lastCol}${summaryStartRow + numCOs}`).style('verticalAlignment', 'center');

        // Adjust column widths for the summary table
        sheet.column(cols[0]).width(12); // CO Name
        sheet.column(cols[1]).width(15); // Appeared
        sheet.column(cols[2]).width(15); // Attained
        sheet.column(cols[3]).width(20); // 3-Point Scale (usually column AH)
        sheet.column(cols[4]).width(25); // Attainment Percentage
    }
}
