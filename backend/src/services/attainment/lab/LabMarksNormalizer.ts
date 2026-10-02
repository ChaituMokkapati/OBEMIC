import { LabStudentRange } from './LabStudentRangeDetector';
import { LabWorkbookMeta } from './LabWorkbookValidator';

export class LabMarksNormalizer {
    public normalizeAndValidate(sheet: any, range: LabStudentRange, meta: LabWorkbookMeta): void {
        const cols = ['D', 'E']; // Internal, External
        const maxMarks = [meta.internalMaxMarks, meta.externalMaxMarks];

        for (let r = range.startRow; r <= range.endRow; r++) {
            for (let i = 0; i < 2; i++) {
                const c = cols[i];
                const max = maxMarks[i];
                const cell = sheet.cell(`${c}${r}`);
                let val = cell.value();

                if (typeof val === 'string') {
                    const trimmed = val.trim().toUpperCase();
                    if (trimmed === 'AB') {
                        cell.value('AB'); // Canonicalize
                        continue;
                    } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
                        val = Number(trimmed);
                        cell.value(val); // Convert valid string numbers to numbers
                    } else {
                        throw new Error(`Invalid mark '${val}' at Row ${r}, Col ${c}. Only numeric values or 'AB' are allowed.`);
                    }
                }

                if (typeof val === 'number') {
                    if (val < 0) {
                        throw new Error(`Negative mark ${val} at Row ${r}, Col ${c} is not allowed.`);
                    }
                    if (val > max) {
                        throw new Error(`Mark ${val} at Row ${r}, Col ${c} exceeds maximum marks of ${max}.`);
                    }
                } else if (val === undefined || val === null || val === '') {
                    throw new Error(`Blank mark at Row ${r}, Col ${c}. Blank marks are not permitted for actual students.`);
                }
            }
        }
    }
}
