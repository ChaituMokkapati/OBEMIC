import { SemanticColumn } from '../shared/HeaderScanner';
import { HeaderMatcher } from '../shared/HeaderMatcher';

export interface ExternalColumnMap {
    cos: Record<string, {
        partA_a: string;
        partA_b: string;
        partB_1: string;
        partB_2: string;
    }>;
}

export class ExternalHeaderMapper {
    private matcher = new HeaderMatcher();

    public map(columns: SemanticColumn[], courseOutcomes: { coCode: string }[]): ExternalColumnMap {
        const resolve = (path: string[], required: boolean = true): string => {
            const matches = this.matcher.match(columns, path);
            if (matches.length > 0) return matches[0].colLetter; // Take the first match (leftmost origin)
            
            if (required) {
                throw new Error(`INVALID_EXTERNAL_MARKS_TEMPLATE: Missing required semantic header for [${path.join(' -> ')}].`);
            }
            return '';
        };

        const map: ExternalColumnMap = { cos: {} };

        // For each required CO, resolve its 4 components dynamically
        courseOutcomes.forEach((co, index) => {
            const code = co.coCode.toUpperCase(); // e.g. CO1
            
            // Calculate dynamic letters for Part A
            // CO1 -> A, B
            // CO2 -> C, D
            // CO3 -> E, F
            // CO4 -> G, H
            // CO5 -> I, J
            const letter1 = String.fromCharCode(65 + (index * 2)); // 'A', 'C', 'E'...
            const letter2 = String.fromCharCode(66 + (index * 2)); // 'B', 'D', 'F'...

            // Calculate dynamic numbers for Part B
            // CO1 -> 1, 2
            // CO2 -> 3, 4
            // CO3 -> 5, 6
            // CO4 -> 7, 8
            // CO5 -> 9, 10
            const num1 = (index * 2) + 1;
            const num2 = (index * 2) + 2;

            map.cos[code] = {
                partA_a: resolve(['PART A', `PART A ${code}`, letter1]),
                partA_b: resolve(['PART A', `PART A ${code}`, letter2]),
                partB_1: resolve(['PART B', `PART B ${code}`, String(num1)]),
                partB_2: resolve(['PART B', `PART B ${code}`, String(num2)]),
            };
        });

        return map;
    }
}
