import { COWorkbookReader } from '../../../../../src/services/admin/imports/course-outcomes/COWorkbookReader';
import { COImportValidator } from '../../../../../src/services/admin/imports/course-outcomes/COImportValidator';

describe('CO Imports', () => {
  it('should instantiate reader without error', () => {
    const reader = new COWorkbookReader();
    expect(reader).toBeDefined();
  });
  
  it('should instantiate validator without error', () => {
    const validator = new COImportValidator();
    expect(validator).toBeDefined();
  });
});
