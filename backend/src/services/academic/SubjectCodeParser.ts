export interface ParsedSubjectCode {
  rawSubjectCode: string;
  normalizedSubjectCode: string;
  matchedPattern: string;
  regulationCode: string;
  subjectBranchToken: string;
  semesterNumber: number;
  subjectType: string;
  sequenceCode: string;
}

/**
 * Parses and extracts semantic components from an institutional Subject Code.
 * Currently supports the verified 'NNLLNLNN' pattern (e.g. 23ME3T01, 23CS3L05)
 */
export class SubjectCodeParser {
  private static readonly PATTERN_NNLLNLNN = /^(\d{2})([A-Z]{2,3})(\d)([A-Z]+)(\d{2,3})$/i;

  public static parse(rawSubjectCode: string): ParsedSubjectCode {
    if (!rawSubjectCode) {
      throw new Error('INVALID_SUBJECT_CODE: Subject code cannot be empty.');
    }

    // Normalize: trim and remove all internal whitespace, uppercase
    const normalizedSubjectCode = rawSubjectCode.replace(/\s+/g, '').toUpperCase();

    // Try dominant pattern NNLLNLNN
    const match = this.PATTERN_NNLLNLNN.exec(normalizedSubjectCode);
    
    if (match) {
      return {
        rawSubjectCode,
        normalizedSubjectCode,
        matchedPattern: 'NNLLNLNN',
        regulationCode: match[1],
        subjectBranchToken: match[2],
        semesterNumber: parseInt(match[3], 10),
        subjectType: match[4],
        sequenceCode: match[5]
      };
    }

    // Fallback: If no patterns match, reject it rather than making assumptions
    throw new Error(`UNSUPPORTED_SUBJECT_PATTERN: The subject code '${rawSubjectCode}' does not match any known grammar patterns.`);
  }
}
