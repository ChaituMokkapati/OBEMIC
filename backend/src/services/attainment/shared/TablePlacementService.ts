export class TablePlacementService {
    /**
     * Determines the starting column for the engine's output.
     * Clears any existing OBEMIC-generated tables found first, so the boundary isn't artificially pushed right.
     */
    public resolvePlacement(sheet: any, headerRows: number[] = [8, 9, 10, 1, 2, 3, 4, 5], gap: number = 2): number {
        // 1. Identify and clear existing OBEMIC output
        this.clearExistingOutput(sheet);

        // 2. Find the rightmost used column in the raw marks table
        let maxCol = 1;
        
        // Scan the likely header rows up to 100 columns to find the rightmost data
        for (const r of headerRows) {
            for (let c = 100; c >= 1; c--) {
                const val = sheet.row(r).cell(c).value();
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                    if (c > maxCol) {
                        maxCol = c;
                    }
                    break; // Move to next row
                }
            }
        }

        // 3. Add gap
        return maxCol + gap;
    }

    private clearExistingOutput(sheet: any): void {
        // Look for the explicit engine markers in a wide range of columns
        // e.g. "Student CO Attainment"
        
        for (let c = 1; c <= 150; c++) {
            // Check rows 1 to 20 for the marker
            for (let r = 1; r <= 20; r++) {
                const val = sheet.row(r).cell(c).value();
                if (val === 'Student CO Attainment' || val === 'CO Attainment Summary') {
                    // We found an old generated region. Clear it.
                    // To clear it safely, we clear the entire column from row 1 to 500
                    // Since OBEMIC tables are always placed to the right, we can clear from c up to 150.
                    // Wait, clearing the whole column is safe because it's strictly engine output area.
                    
                    for (let clearCol = c; clearCol <= c + 25; clearCol++) { // Clear a wide enough block (5 COs * multiple tables)
                        sheet.column(clearCol).hidden(false);
                        sheet.column(clearCol).width(undefined);
                        for (let clearRow = 1; clearRow <= 500; clearRow++) {
                            const cell = sheet.cell(clearRow, clearCol);
                            cell.value(undefined);
                            cell.formula(undefined);
                            cell.style('fill', undefined);
                            cell.style('border', undefined);
                            cell.style('fontColor', undefined);
                            cell.style('bold', undefined);
                        }
                        // Unmerge any merged cells in this column
                        // (xlsx-populate requires unmerging the exact range, which is hard to guess, but setting value to undefined breaks the visual anyway)
                    }
                    return; // Once we clear the block starting from the marker, we're done.
                }
            }
        }
    }

    public getColLetter(colIndex: number): string {
        let letter = '';
        while (colIndex > 0) {
            let temp = (colIndex - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            colIndex = (colIndex - temp - 1) / 26;
        }
        return letter;
    }
}
