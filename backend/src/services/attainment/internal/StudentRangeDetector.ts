export interface StudentRange {
    startRow: number;
    endRow: number;
    count: number;
}

export class StudentRangeDetector {
    public detect(sheet: any): StudentRange {
        let startRow = -1;
        let endRow = -1;
        
        // Scan for the first roll number in Col B
        // We know it starts at 13 in the reference workbook, but let's detect it safely.
        // We look for 10-character alphanumeric strings in Column 2 (B) after row 10.
        for (let r = 10; r <= 30; r++) {
            const val = sheet.cell(r, 2).value();
            if (val && typeof val === 'string' && /^[0-9A-Z]{10}$/i.test(val.trim())) { 
                startRow = r;
                break;
            }
        }
        
        if (startRow === -1) {
            // Fallback to exactly what the user mapped
            startRow = 13;
        }

        for (let r = startRow; r <= 300; r++) {
            const val = sheet.cell(r, 2).value();
            if (!val || String(val).trim() === '') {
                endRow = r - 1;
                break;
            }
        }

        if (endRow < startRow) {
            throw new Error("Could not detect a valid student range in the workbook.");
        }

        return {
            startRow,
            endRow,
            count: endRow - startRow + 1
        };
    }
}
