export class ExternalStyleHelper {
    public static applyTitleStyle(range: any): void {
        range.style('bold', true);
        range.style('horizontalAlignment', 'center');
        range.style('verticalAlignment', 'center');
        range.style('fill', 'D9EAD3'); // Light green distinct fill
        range.style('border', true);
    }

    public static applyHeaderStyle(range: any): void {
        range.style('bold', true);
        range.style('horizontalAlignment', 'center');
        range.style('verticalAlignment', 'center');
        range.style('fill', 'C9DAF8'); // Light blue distinct fill
        range.style('border', true);
    }

    public static applyDataStyle(range: any): void {
        range.style('horizontalAlignment', 'center');
        range.style('verticalAlignment', 'center');
        range.style('border', true);
    }

    public static applyNumericFormat(range: any): void {
        range.style('numberFormat', '0.00');
    }

    public static setColumnWidths(sheet: any, cols: string[], width: number): void {
        cols.forEach(col => sheet.column(col).width(width));
    }
}
