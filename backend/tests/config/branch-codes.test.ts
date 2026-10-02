import { resolveDepartmentCodeByAlias, resolveDepartmentConfigBySubjectToken } from '../../src/config/branch-codes';

describe('DepartmentCodeConfig', () => {
  describe('resolveDepartmentCodeByAlias', () => {
    it('should resolve by exact department code', () => {
      const result = resolveDepartmentCodeByAlias('CSE');
      expect(result?.departmentCode).toBe('CSE');
    });

    it('should resolve by alias regardless of case and spacing', () => {
      const result = resolveDepartmentCodeByAlias('  computer science engineering  ');
      expect(result?.departmentCode).toBe('CSE');
      
      const mechResult = resolveDepartmentCodeByAlias('Mechanical Engineering');
      expect(mechResult?.departmentCode).toBe('MECH');
    });

    it('should return null for unknown aliases', () => {
      const result = resolveDepartmentCodeByAlias('UNKNOWN DEPT');
      expect(result).toBeNull();
    });

    it('should handle null/empty input', () => {
      expect(resolveDepartmentCodeByAlias('')).toBeNull();
    });
  });

  describe('resolveDepartmentConfigBySubjectToken', () => {
    it('should resolve by subject token', () => {
      const result = resolveDepartmentConfigBySubjectToken('CS');
      expect(result?.departmentCode).toBe('CSE');
      expect(result?.subjectCodeToken).toBe('CS');
      
      const mechResult = resolveDepartmentConfigBySubjectToken('ME');
      expect(mechResult?.departmentCode).toBe('MECH');
    });

    it('should handle case insensitivity and whitespace', () => {
      const result = resolveDepartmentConfigBySubjectToken(' cs ');
      expect(result?.departmentCode).toBe('CSE');
    });

    it('should return null for unknown token', () => {
      expect(resolveDepartmentConfigBySubjectToken('XX')).toBeNull();
    });
  });
});
