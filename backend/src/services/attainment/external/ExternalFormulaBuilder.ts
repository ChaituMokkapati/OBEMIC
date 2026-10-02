import { ExternalColumnMap } from './ExternalHeaderMapper';

export class ExternalFormulaBuilder {
    
    /**
     * Constructs the Student CO Attainment formula for the external exam.
     * Rule: ROUND(((((PartA_COx_a + PartA_COx_b) / 2) + MAX(PartB_COx_1, PartB_COx_2)) / 14) * 3, 2)
     * If any part is AB, we must prevent mixing it with numbers.
     * Wait, the user said it's impossible to have a mixture, but we should validate or just rely on the rule.
     * Since AB is absent, if they are all AB, the cell should evaluate to AB.
     * 
     * If Part A `a` is "AB", then all of them are "AB" per business rule.
     * So we can just wrap the formula in an IF check:
     * IF(a="AB", "AB", ROUND(...))
     */
    public getCOFormula(row: number, coCode: string, map: ExternalColumnMap): string {
        const code = coCode.toUpperCase();
        const coMap = map.cos[code];
        
        const a = `${coMap.partA_a}${row}`;
        const b = `${coMap.partA_b}${row}`;
        const p1 = `${coMap.partB_1}${row}`;
        const p2 = `${coMap.partB_2}${row}`;

        // If 'a' is "AB", we output "AB". Otherwise, do the math.
        const math = `ROUND(((((${a}+${b})/2)+MAX(${p1},${p2}))/14)*3,2)`;
        return `IF(TRIM(UPPER(${a}))="AB", "AB", ${math})`;
    }

    public getAppearedFormula(colLetter: string, startRow: number, endRow: number): string {
        return `COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},">=0")`;
    }

    public getAttainedFormula(colLetter: string, startRow: number, endRow: number, threshold: number): string {
        return `COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},">=${threshold}")`;
    }

    public get3PointScaleFormula(attainedCell: string, appearedCell: string): string {
        return `IFERROR(ROUND((${attainedCell}/${appearedCell})*3,2),0)`;
    }

    public getAttainmentPercentageFormula(attainedCell: string, appearedCell: string): string {
        return `IFERROR(ROUND((${attainedCell}/${appearedCell})*100,2),0)`;
    }
}
