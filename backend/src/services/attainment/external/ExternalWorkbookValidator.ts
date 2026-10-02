export class ExternalWorkbookValidator {
    public validateWorkbook(workbook: any): void {
        if (!workbook) {
            throw new Error("INVALID_EXTERNAL_MARKS_TEMPLATE: Workbook is null or undefined.");
        }
    }

    public resolveSubjectWorksheet(workbook: any, subjectCode: string): any {
        let sheet = workbook.sheet(subjectCode);
        
        if (!sheet) {
            sheet = workbook.sheet(0);
            if (!sheet) {
                throw new Error("INVALID_EXTERNAL_MARKS_TEMPLATE: Could not find any worksheet in the uploaded file.");
            }
        }
        
        return sheet;
    }
}
