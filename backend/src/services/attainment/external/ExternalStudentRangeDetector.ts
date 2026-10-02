export interface ExternalStudentRange {
    startRow: number;
    endRow: number;
    count: number;
}

export class ExternalStudentRangeDetector {
    public detect(sheet: any): ExternalStudentRange {
        const startRow = 8;
        let endRow = 8;
        
        while (true) {
            const val = sheet.cell(`B${endRow}`).value();
            if (val === undefined || val === null || val === '') {
                break;
            }
            endRow++;
        }
        
        endRow--; // Step back to the last valid row

        if (endRow < startRow) {
            throw new Error("No students detected starting from row 8.");
        }

        return {
            startRow,
            endRow,
            count: endRow - startRow + 1
        };
    }
}
