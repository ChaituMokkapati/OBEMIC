import { ExternalColumnMap } from './ExternalHeaderMapper';
import { ExternalFormulaBuilder } from './ExternalFormulaBuilder';

export class ExternalCOAttainmentWriter {
    private builder = new ExternalFormulaBuilder();

    public write(
        sheet: any, 
        range: { startRow: number, endRow: number }, 
        courseOutcomes: { coCode: string }[], 
        colMap: ExternalColumnMap,
        startColIndex: number,
        threshold: number
    ): { startCol: number, endCol: number } {
        
        const numCOs = courseOutcomes.length;
        if (numCOs > 6) {
            throw new Error(`The external template currently only supports up to 6 COs. Found: ${numCOs}`);
        }

        // We place the external attainment columns starting at `startColIndex`
        const cols: string[] = [];
        for (let i = 0; i < numCOs; i++) {
            cols.push(this.getColLetter(startColIndex + i));
        }

        const startCol = startColIndex;
        const endCol = startColIndex + numCOs - 1;
        const startLetter = cols[0];
        const endLetter = cols[numCOs - 1];

        // 1. Write headers
        // Row 3: "External Attainment (Max: 3)" merged across all CO columns
        const headerRow3 = sheet.row(3);
        headerRow3.cell(startCol).value("External Attainment (Max: 3)").style({ horizontalAlignment: 'center', bold: true, fill: 'C6E0B4' });
        if (numCOs > 1) {
            sheet.range(`${startLetter}3:${endLetter}3`).merged(true);
        }

        // Row 4: CO Codes (CO1, CO2, ...)
        const headerRow4 = sheet.row(4);
        courseOutcomes.forEach((co, idx) => {
            headerRow4.cell(startCol + idx).value(co.coCode).style({ horizontalAlignment: 'center', bold: true, fill: 'C6E0B4' });
        });

        // 2. Write Student Formulas (Row by Row)
        for (let r = range.startRow; r <= range.endRow; r++) {
            const studentRow = sheet.row(r);
            courseOutcomes.forEach((co, idx) => {
                const formula = this.builder.getCOFormula(r, co.coCode, colMap);
                studentRow.cell(startCol + idx).formula(formula).style({ horizontalAlignment: 'center' });
            });
        }

        // 3. Style the table and set widths
        sheet.range(`${startLetter}3:${endLetter}${range.endRow}`).style({ border: true });
        for (let i = 0; i < numCOs; i++) {
            sheet.column(startCol + i).width(12);
        }

        return { startCol, endCol };
    }

    private getColLetter(colIndex: number): string {
        let letter = '';
        while (colIndex > 0) {
            let temp = (colIndex - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            colIndex = (colIndex - temp - 1) / 26;
        }
        return letter;
    }
}
