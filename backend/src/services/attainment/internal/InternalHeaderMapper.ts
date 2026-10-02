import { SemanticColumn } from '../shared/HeaderScanner';
import { HeaderMatcher } from '../shared/HeaderMatcher';

export interface InternalColumnMap {
    mid1: {
        q1: string;
        q2: string;
        q3: string;
        q4: string;
        q5: string;
        q6: string;
        objective: string;
    };
    mid2: {
        q1: string;
        q2: string;
        q3: string;
        q4: string;
        q5: string;
        q6: string;
        objective: string;
    };
    // Note: Unit Test is ignored in the approved math, so we only map Objective
}

export class InternalHeaderMapper {
    private matcher = new HeaderMatcher();

    public map(columns: SemanticColumn[]): InternalColumnMap {
        const resolve = (path: string[], required: boolean = true): string => {
            const matches = this.matcher.match(columns, path);
            if (matches.length > 0) return matches[0].colLetter; // Take the first match (leftmost origin)
            
            if (required) {
                throw new Error(`INVALID_INTERNAL_MARKS_TEMPLATE: Missing required semantic header for [${path.join(' -> ')}].`);
            }
            return '';
        };

        return {
            mid1: {
                q1: resolve(['MID I', 'DESCRIPTIVE', 'Q1']),
                q2: resolve(['MID I', 'DESCRIPTIVE', 'Q2']),
                q3: resolve(['MID I', 'DESCRIPTIVE', 'Q3']),
                q4: resolve(['MID I', 'DESCRIPTIVE', 'Q4']),
                q5: resolve(['MID I', 'DESCRIPTIVE', 'Q5']),
                q6: resolve(['MID I', 'DESCRIPTIVE', 'Q6']),
                objective: resolve(['MID I', 'OBJECTIVE 1']),
            },
            mid2: {
                q1: resolve(['MID II', 'DESCRIPTIVE', 'Q1']),
                q2: resolve(['MID II', 'DESCRIPTIVE', 'Q2']),
                q3: resolve(['MID II', 'DESCRIPTIVE', 'Q3']),
                q4: resolve(['MID II', 'DESCRIPTIVE', 'Q4']),
                q5: resolve(['MID II', 'DESCRIPTIVE', 'Q5']),
                q6: resolve(['MID II', 'DESCRIPTIVE', 'Q6']),
                objective: resolve(['MID II', 'OBJECTIVE 2']),
            }
        };
    }
}
