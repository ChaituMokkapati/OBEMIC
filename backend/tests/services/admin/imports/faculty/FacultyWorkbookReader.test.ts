import { FacultyWorkbookReader } from '../../../../../src/services/admin/imports/faculty/FacultyWorkbookReader';
import { FacultyImportValidator } from '../../../../../src/services/admin/imports/faculty/FacultyImportValidator';

describe('Faculty Imports', () => {
  it('should instantiate reader without error', () => {
    const reader = new FacultyWorkbookReader();
    expect(reader).toBeDefined();
  });
  
  it('should instantiate validator without error', () => {
    const validator = new FacultyImportValidator();
    expect(validator).toBeDefined();
  });
});
