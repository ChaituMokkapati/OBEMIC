import { HeaderNormalizer } from './HeaderNormalizer';

export interface SemanticColumn {
    colLetter: string;
    colIndex: number;
    path: string[];
}

export class HeaderScanner {
    private normalizer = new HeaderNormalizer();

    public scan(sheet: any, maxRows: number = 10, maxCols: number = 50): SemanticColumn[] {
        const columns: SemanticColumn[] = [];

        for (let c = 1; c <= maxCols; c++) {
            columns.push({
                colLetter: this.getColLetter(c),
                colIndex: c,
                path: []
            });
        }

        for (let r = 1; r <= maxRows; r++) {
            let currentParent = '';
            let currentParentOriginCol = -1;
            
            // Snapshot the paths BEFORE this row so we can safely compare them
            const prevPaths = columns.map(c => c.path.join('|'));
            
            for (let c = 1; c <= maxCols; c++) {
                const val = sheet.row(r).cell(c).value();
                let normalized = this.normalizer.normalize(val);

                if (normalized) {
                    currentParent = normalized;
                    currentParentOriginCol = c;
                }

                if (currentParent && currentParentOriginCol !== -1) {
                    // We can only propagate if the current column shared the exact same path
                    // as the origin column in the rows ABOVE this one.
                    const originPath = prevPaths[currentParentOriginCol - 1];
                    const thisPath = prevPaths[c - 1];

                    if (originPath === thisPath) {
                        const pathLen = columns[c - 1].path.length;
                        if (pathLen === 0 || columns[c - 1].path[pathLen - 1] !== currentParent) {
                            columns[c - 1].path.push(currentParent);
                        }
                    } else if (!normalized) {
                        // Stop propagating if it's an empty cell crossing a boundary
                        currentParent = '';
                        currentParentOriginCol = -1;
                    }
                }
            }
        }

        return columns;
    }

    private getColLetter(colIndex: number): string {
        let letter = '';
        while (colIndex > 0) {
            let temp = (colIndex - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            colIndex = (colIndex - temp - 1) / 26;
        }
        return letter;
    }
}
