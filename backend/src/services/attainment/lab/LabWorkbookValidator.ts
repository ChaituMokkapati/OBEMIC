export interface LabWorkbookMeta {
    internalMaxMarks: number;
    externalMaxMarks: number;
}

export class LabWorkbookValidator {
    public validate(sheet: any): LabWorkbookMeta {
        if (!sheet) {
            throw new Error("Worksheet is null or undefined.");
        }
        
        // Ensure this is actually the Lab template by checking headers on row 7
        const internalHeader = sheet.cell('D7').value();
        const externalHeader = sheet.cell('E7').value();

        if (typeof internalHeader !== 'string' || typeof externalHeader !== 'string') {
            throw new Error("Missing or malformed Internal/External headers in row 7.");
        }

        const internalMatch = internalHeader.match(/(\d+)/);
        const externalMatch = externalHeader.match(/(\d+)/);

        if (!internalMatch || !externalMatch) {
            throw new Error("Could not extract maximum marks from Internal/External headers.");
        }

        const internalMaxMarks = parseInt(internalMatch[1], 10);
        const externalMaxMarks = parseInt(externalMatch[1], 10);

        if (internalMaxMarks <= 0 || externalMaxMarks <= 0) {
            throw new Error("Maximum marks must be greater than 0.");
        }

        return { internalMaxMarks, externalMaxMarks };
    }
}
