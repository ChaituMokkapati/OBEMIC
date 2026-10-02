import { InternalFormulaBuilder } from './InternalFormulaBuilder';
import { StudentRange } from '../shared/DynamicStudentRangeDetector';
import { InternalColumnMap } from './InternalHeaderMapper';
import { TablePlacementService } from '../shared/TablePlacementService';

export class StudentCOAttainmentWriter {
    private builder = new InternalFormulaBuilder();
    private placement = new TablePlacementService();

    public write(sheet: any, range: StudentRange, courseOutcomes: { coCode: string }[], map: InternalColumnMap, startColIndex: number, threshold: number = 1.8): void {
        const numCOs = courseOutcomes.length;
        if (numCOs > 5) {
            throw new Error(`The internal template currently only supports up to 5 COs. Found: ${numCOs}`);
        }

        const cols: string[] = [];
        for (let i = 0; i < numCOs; i++) {
            cols.push(this.placement.getColLetter(startColIndex + i));
        }
        
        const firstCol = cols[0];
        const lastCol = cols[numCOs - 1]; 

        // 1. Write Headers (Dynamically placed relative to student rows)
        const titleRow = range.startRow - 2;
        const colHeaderRow = range.startRow - 1;

        sheet.cell(`${firstCol}${titleRow}`).value('Student CO Attainment');
        sheet.range(`${firstCol}${titleRow}:${lastCol}${titleRow}`).merged(true);
        sheet.range(`${firstCol}${titleRow}:${lastCol}${titleRow}`).style('horizontalAlignment', 'center');
        sheet.range(`${firstCol}${titleRow}:${lastCol}${titleRow}`).style('bold', true);
        sheet.range(`${firstCol}${titleRow}:${lastCol}${titleRow}`).style('fill', 'C6E0B4'); // Light green background
        sheet.range(`${firstCol}${titleRow}:${lastCol}${titleRow}`).style('border', true);
        
        for (let i = 0; i < numCOs; i++) {
            const cell = sheet.cell(`${cols[i]}${colHeaderRow}`);
            cell.value(courseOutcomes[i].coCode); // e.g. CO1, CO2
            cell.style('bold', true);
            cell.style('horizontalAlignment', 'center');
            cell.style('fill', 'C6E0B4');
        }

        // Helper to evaluate static value for coloring
        const getVal = (col: string, row: number) => {
            const val = sheet.cell(`${col}${row}`).value();
            return typeof val === 'number' ? val : 0;
        };

        const calcCO = (row: number, type: number): number => {
            let val = 0;
            if (type === 1) val = (Math.max(getVal(map.mid1.q1, row), getVal(map.mid1.q2, row)) + getVal(map.mid1.objective, row)) / 20 * 3;
            if (type === 2) val = (Math.max(getVal(map.mid1.q3, row), getVal(map.mid1.q4, row)) + getVal(map.mid1.objective, row)) / 20 * 3;
            if (type === 3) val = (Math.max(getVal(map.mid1.q5, row), getVal(map.mid1.q6, row)) + getVal(map.mid1.objective, row) + Math.max(getVal(map.mid2.q1, row), getVal(map.mid2.q2, row)) + getVal(map.mid2.objective, row)) / 40 * 3;
            if (type === 4) val = (Math.max(getVal(map.mid2.q3, row), getVal(map.mid2.q4, row)) + getVal(map.mid2.objective, row)) / 20 * 3;
            if (type === 5) val = (Math.max(getVal(map.mid2.q5, row), getVal(map.mid2.q6, row)) + getVal(map.mid2.objective, row)) / 20 * 3;
            return Math.round(val * 100) / 100;
        };

        const applyColor = (cell: any, row: number, type: number) => {
            if (calcCO(row, type) < threshold) {
                cell.style('fill', 'FFC7CE'); // Light red
                cell.style('fontColor', '9C0006'); // Dark red text
            }
        };

        // 2. Write Formulas for actual students only
        for (let r = range.startRow; r <= range.endRow; r++) {
            if (numCOs >= 1) { const c1 = sheet.cell(`${cols[0]}${r}`); c1.formula(this.builder.getCO1Formula(r, map)); applyColor(c1, r, 1); }
            if (numCOs >= 2) { const c2 = sheet.cell(`${cols[1]}${r}`); c2.formula(this.builder.getCO2Formula(r, map)); applyColor(c2, r, 2); }
            if (numCOs >= 3) { const c3 = sheet.cell(`${cols[2]}${r}`); c3.formula(this.builder.getCO3Formula(r, map)); applyColor(c3, r, 3); }
            if (numCOs >= 4) { const c4 = sheet.cell(`${cols[3]}${r}`); c4.formula(this.builder.getCO4Formula(r, map)); applyColor(c4, r, 4); }
            if (numCOs >= 5) { const c5 = sheet.cell(`${cols[4]}${r}`); c5.formula(this.builder.getCO5Formula(r, map)); applyColor(c5, r, 5); }
        }

        // 3. Add formatting (borders, alignment, widths)
        for (let i = 0; i < numCOs; i++) {
            sheet.column(cols[i]).width(12);
        }

        sheet.range(`${firstCol}10:${lastCol}${range.endRow}`).style('border', true);
        sheet.range(`${firstCol}${range.startRow}:${lastCol}${range.endRow}`).style('horizontalAlignment', 'center');
        sheet.range(`${firstCol}${range.startRow}:${lastCol}${range.endRow}`).style('verticalAlignment', 'center');
    }
}
