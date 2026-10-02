import { InternalColumnMap } from './InternalHeaderMapper';

export class InternalFormulaBuilder {
    // ----------------------------------------------------
    // Student CO Attainment Formulas
    // ----------------------------------------------------
    public getCO1Formula(row: number, map: InternalColumnMap): string {
        return `IFERROR(ROUND((MAX(${map.mid1.q1}${row},${map.mid1.q2}${row})+${map.mid1.objective}${row})/20*3,2), "AB")`;
    }

    public getCO2Formula(row: number, map: InternalColumnMap): string {
        return `IFERROR(ROUND((MAX(${map.mid1.q3}${row},${map.mid1.q4}${row})+${map.mid1.objective}${row})/20*3,2), "AB")`;
    }

    public getCO3Formula(row: number, map: InternalColumnMap): string {
        return `IFERROR(ROUND((MAX(${map.mid1.q5}${row},${map.mid1.q6}${row})+${map.mid1.objective}${row}+MAX(${map.mid2.q1}${row},${map.mid2.q2}${row})+${map.mid2.objective}${row})/40*3,2), "AB")`;
    }

    public getCO4Formula(row: number, map: InternalColumnMap): string {
        return `IFERROR(ROUND((MAX(${map.mid2.q3}${row},${map.mid2.q4}${row})+${map.mid2.objective}${row})/20*3,2), "AB")`;
    }

    public getCO5Formula(row: number, map: InternalColumnMap): string {
        return `IFERROR(ROUND((MAX(${map.mid2.q5}${row},${map.mid2.q6}${row})+${map.mid2.objective}${row})/20*3,2), "AB")`;
    }

    // ----------------------------------------------------
    // CO Summary Formulas
    // ----------------------------------------------------
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
