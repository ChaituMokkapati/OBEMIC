import { SemanticColumn } from './HeaderScanner';
import { HeaderMatcher } from './HeaderMatcher';

export interface StudentRange {
    startRow: number;
    endRow: number;
    count: number;
    studentIdColIndex: number;
    studentIdColLetter: string;
    studentNameColIndex?: number;
    studentNameColLetter?: string;
}

export class DynamicStudentRangeDetector {
    private matcher = new HeaderMatcher();

    public detect(sheet: any, columns: SemanticColumn[], aliases: string[] = ['ROLL NO', 'ROLL NUMBER', 'REGD NO', 'REGD.NO', 'STUDENT ROLL NUMBER']): StudentRange {
        // 1. Find the column that contains the student identifier
        let studentCol: SemanticColumn | undefined;
        let nameCol: SemanticColumn | undefined;
        
        for (const alias of aliases) {
            const matches = this.matcher.match(columns, [alias]);
            if (matches.length > 0) {
                studentCol = matches[0];
                break;
            }
        }

        if (!studentCol) {
            throw new Error(`Could not find Student Identifier column. Tried aliases: ${aliases.join(', ')}`);
        }

        // Try to find Name column
        const nameAliases = ['NAME', 'STUDENT NAME', 'NAME OF THE STUDENT'];
        for (const alias of nameAliases) {
            const matches = this.matcher.match(columns, [alias]);
            if (matches.length > 0) {
                nameCol = matches[0];
                break;
            }
        }

        // 2. Scan down the column to find the first valid 10-char alphanumeric string
        let startRow = -1;
        let endRow = -1;
        const colIdx = studentCol.colIndex;

        for (let r = 5; r <= 50; r++) { // Scan header area downwards
            const val = sheet.row(r).cell(colIdx).value();
            if (val && typeof val === 'string' && /^[0-9A-Z]{10}$/i.test(val.trim())) { 
                startRow = r;
                break;
            }
        }

        if (startRow === -1) {
            throw new Error(`Found Student Identifier column (${studentCol.colLetter}), but could not find any valid 10-character roll numbers.`);
        }

        // 3. Keep scanning until we hit an empty cell
        for (let r = startRow; r <= 500; r++) {
            const val = sheet.row(r).cell(colIdx).value();
            if (!val || String(val).trim() === '') {
                endRow = r - 1;
                break;
            }
        }

        return {
            startRow,
            endRow,
            count: endRow - startRow + 1,
            studentIdColIndex: colIdx,
            studentIdColLetter: studentCol.colLetter,
            studentNameColIndex: nameCol?.colIndex,
            studentNameColLetter: nameCol?.colLetter
        };
    }
}
