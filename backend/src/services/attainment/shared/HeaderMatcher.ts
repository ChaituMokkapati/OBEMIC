import { SemanticColumn } from './HeaderScanner';
import { HeaderNormalizer } from './HeaderNormalizer';

export class HeaderMatcher {
    private normalizer = new HeaderNormalizer();

    /**
     * Finds columns whose semantic path includes the required search path tokens in order.
     * Example searchPath: ["MID I", "Q1"]
     */
    public match(columns: SemanticColumn[], searchPath: string[]): SemanticColumn[] {
        const normalizedSearch = searchPath.map(s => this.normalizer.normalize(s));
        
        return columns.filter(col => {
            let searchIdx = 0;
            for (const token of col.path) {
                // Exact match is safest. But to be slightly forgiving, we check if the token
                // matches exactly or if it contains the search string bounded by spaces/ends.
                const searchStr = normalizedSearch[searchIdx];
                if (token === searchStr || token.split(' ').includes(searchStr)) {
                    searchIdx++;
                }
                if (searchIdx === normalizedSearch.length) {
                    return true;
                }
            }
            return false;
        });
    }
}
