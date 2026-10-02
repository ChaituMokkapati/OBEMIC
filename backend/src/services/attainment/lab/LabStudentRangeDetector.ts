export interface LabStudentRange {
    startRow: number;
    endRow: number;
    count: number;
}

export class LabStudentRangeDetector {
    public detect(sheet: any): LabStudentRange {
        const startRow = 9;
        let endRow = 9;
        
        while (true) {
            const val = sheet.cell(`B${endRow}`).value();
            if (val === undefined || val === null || val === '') {
                break;
            }
            endRow++;
        }
        
        endRow--; // Step back to the last valid row

        if (endRow < startRow) {
            throw new Error("No students detected starting from row 9.");
        }

        return {
            startRow,
            endRow,
            count: endRow - startRow + 1
        };
    }
}
