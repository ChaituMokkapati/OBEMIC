import { SubjectCodeParser } from '../../../src/services/academic/SubjectCodeParser';

describe('SubjectCodeParser', () => {
  describe('parse()', () => {
    it('should successfully parse a valid NNLLNLNN code', () => {
      const result = SubjectCodeParser.parse('23ME3T01');
      expect(result).toEqual({
        rawSubjectCode: '23ME3T01',
        normalizedSubjectCode: '23ME3T01',
        matchedPattern: 'NNLLNLNN',
        regulationCode: '23',
        subjectBranchToken: 'ME',
        semesterNumber: 3,
        subjectType: 'T',
        sequenceCode: '01'
      });
    });

    it('should parse Lab subjects correctly', () => {
      const result = SubjectCodeParser.parse('23ME3L05');
      expect(result.subjectType).toBe('L');
    });

    it('should handle whitespaces and lowercase strings', () => {
      const result = SubjectCodeParser.parse('  23 me 3 t 01  ');
      expect(result.normalizedSubjectCode).toBe('23ME3T01');
      expect(result.subjectBranchToken).toBe('ME');
      expect(result.semesterNumber).toBe(3);
    });

    it('should handle 3-letter branch tokens', () => {
      const result = SubjectCodeParser.parse('23CSE3T01');
      expect(result.subjectBranchToken).toBe('CSE');
    });

    it('should reject malformed codes', () => {
      // Missing regulation
      expect(() => SubjectCodeParser.parse('ME3T01')).toThrow('UNSUPPORTED_SUBJECT_PATTERN');
      
      // Missing sequence
      expect(() => SubjectCodeParser.parse('23ME3T')).toThrow('UNSUPPORTED_SUBJECT_PATTERN');
      
      // Letters where numbers should be
      expect(() => SubjectCodeParser.parse('23MEZT01')).toThrow('UNSUPPORTED_SUBJECT_PATTERN');
    });

    it('should reject empty or null codes', () => {
      expect(() => SubjectCodeParser.parse('')).toThrow('INVALID_SUBJECT_CODE');
      expect(() => SubjectCodeParser.parse(null as unknown as string)).toThrow('INVALID_SUBJECT_CODE');
    });
  });
});
