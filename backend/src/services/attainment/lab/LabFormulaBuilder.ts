export class LabFormulaBuilder {
    
    public getAttemptedFormula(colLetter: string, startRow: number, endRow: number): string {
        return `COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},">=0")`;
    }

    public getAttainedFormula(colLetter: string, startRow: number, endRow: number, thresholdMarks: number): string {
        return `COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},">=${thresholdMarks}")`;
    }

    public getPercentageFormula(attainedCell: string, attemptedCell: string): string {
        return `IFERROR(${attainedCell}/${attemptedCell},0)`;
    }

    public get3PointAttainmentFormula(attainedCell: string, attemptedCell: string): string {
        return `IFERROR(ROUND((${attainedCell}/${attemptedCell})*3,2),0)`;
    }

    public getDirectAssessmentFormula(internal3PointCell: string, external3PointCell: string): string {
        return `ROUND((0.3*${internal3PointCell})+(0.7*${external3PointCell}),3)`;
    }
}
