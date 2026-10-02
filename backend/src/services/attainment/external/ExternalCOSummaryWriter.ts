import { ExternalFormulaBuilder } from './ExternalFormulaBuilder';

export class ExternalCOSummaryWriter {
    private builder = new ExternalFormulaBuilder();

    public write(
        sheet: any, 
        range: { startRow: number, endRow: number }, 
        courseOutcomes: { coCode: string }[], 
        tableColBounds: { startCol: number, endCol: number },
        threshold: number
    ): void {
        const { startCol, endCol } = tableColBounds;
        const summaryStartRow = range.endRow + 2; // Leave a blank row before summary

        const startLetter = this.getColLetter(startCol);
        const endLetter = this.getColLetter(endCol);

        // Define row indices
        const studentsAppearedRow = summaryStartRow;
        const studentsAttainedRow = summaryStartRow + 1;
        const attainmentPercentageRow = summaryStartRow + 2;
        const attainment3PointScaleRow = summaryStartRow + 3;

        // Write row headers (2 columns before startCol, if possible)
        const rowHeaderCol = startCol > 2 ? startCol - 2 : startCol;
        
        sheet.row(studentsAppearedRow).cell(rowHeaderCol).value('Students Appeared').style({ bold: true, fill: 'C6E0B4' });
        sheet.row(studentsAttainedRow).cell(rowHeaderCol).value(`Students Scored >= ${threshold}`).style({ bold: true, fill: 'C6E0B4' });
        sheet.row(attainmentPercentageRow).cell(rowHeaderCol).value('% Attainment').style({ bold: true, fill: 'C6E0B4' });
        sheet.row(attainment3PointScaleRow).cell(rowHeaderCol).value('Attainment on 3 Point Scale').style({ bold: true, fill: 'C6E0B4' });

        // Adjust row header column width for visibility
        sheet.column(rowHeaderCol).width(25);

        // Write summary formulas for each CO
        for (let idx = 0; idx < courseOutcomes.length; idx++) {
            const colIndex = startCol + idx;
            const colLetter = this.getColLetter(colIndex);

            // Students Appeared
            sheet.row(studentsAppearedRow).cell(colIndex).formula(
                this.builder.getAppearedFormula(colLetter, range.startRow, range.endRow)
            ).style({ horizontalAlignment: 'center' });

            // Students Attained
            sheet.row(studentsAttainedRow).cell(colIndex).formula(
                this.builder.getAttainedFormula(colLetter, range.startRow, range.endRow, threshold)
            ).style({ horizontalAlignment: 'center' });

            // % Attainment
            sheet.row(attainmentPercentageRow).cell(colIndex).formula(
                this.builder.getAttainmentPercentageFormula(
                    `${colLetter}${studentsAttainedRow}`,
                    `${colLetter}${studentsAppearedRow}`
                )
            ).style({ horizontalAlignment: 'center', numberFormat: '0.00' });

            // Attainment on 3 Point Scale
            sheet.row(attainment3PointScaleRow).cell(colIndex).formula(
                this.builder.get3PointScaleFormula(
                    `${colLetter}${studentsAttainedRow}`,
                    `${colLetter}${studentsAppearedRow}`
                )
            ).style({ horizontalAlignment: 'center', numberFormat: '0.00' });
        }

        // Style the summary table borders
        sheet.range(`${this.getColLetter(rowHeaderCol)}${studentsAppearedRow}:${endLetter}${attainment3PointScaleRow}`).style({ border: true });
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
