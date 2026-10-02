import { LabAttainmentService } from '../src/services/attainment/lab/LabAttainmentService';
const XlsxPopulate = require('xlsx-populate');

describe('Level 3: Lab Attainment Pipeline', () => {
    let facultyBuffer: Buffer;
    
    beforeAll(async () => {
        // Generate Mock Workbook for Lab Attainment
        const wb = await XlsxPopulate.fromBlankAsync();
        const sheet = wb.sheet(0);
        sheet.name('Sheet1');
        
        // Setup Row 7 Headers
        sheet.cell('B7').value('Roll No.');
        sheet.cell('D7').value('Internal 30');
        sheet.cell('E7').value('External 70');
        
        // Mock Roll numbers
        sheet.cell('B9').value('22B81A0301');
        sheet.cell('B10').value('22B81A0302');
        sheet.cell('B11').value('22B81A0303');
        // Total 3 students -> End row = 11
        
        // Add marks
        sheet.cell('D9').value(25); // Pass
        sheet.cell('E9').value(60); // Pass
        
        sheet.cell('D10').value(10); // Fail
        sheet.cell('E10').value(30); // Fail
        
        sheet.cell('D11').value('AB'); // Absent
        sheet.cell('E11').value('ab'); // Absent (needs normalization)
        
        facultyBuffer = await wb.outputAsync();
    });

    it('should successfully detect student range and generate reports', async () => {
        const service = new LabAttainmentService();
        const { outputBuffer, report } = await service.generateAttainment(facultyBuffer);
        
        expect(report.success).toBe(true);
        expect(report.studentCount).toBe(3); 
        expect(report.startRow).toBe(9);
        expect(report.endRow).toBe(11);      
        expect(report.internalMax).toBe(30);
        expect(report.externalMax).toBe(70);

        // Check output structure
        const wb = await XlsxPopulate.fromDataAsync(outputBuffer);
        const sheet = wb.sheet('Sheet1');

        // Check AB normalized
        expect(sheet.cell('E11').value()).toBe('AB');

        // Check Summary existence
        expect(sheet.cell('H7').value()).toBe('Lab Attainment Summary');
        
        // Check Direct Assessment existence
        expect(sheet.cell('L7').value()).toBe('Lab CO Direct Assessment');

        // Check Gaps
        expect(sheet.cell('F7').value()).toBeUndefined();
        expect(sheet.cell('G7').value()).toBeUndefined();
        expect(sheet.cell('K7').value()).toBeUndefined();

        // Check formulas
        expect(sheet.cell('I9').formula()).toContain('COUNTIF');
        expect(sheet.cell('I10').formula()).toContain('COUNTIF');
        expect(sheet.cell('I12').formula()).toContain('ROUND');
        expect(sheet.cell('O9').formula()).toContain('ROUND'); // Direct assessment CO1
        
        // Check numeric format
        expect(sheet.cell('I12').style('numberFormat')).toBe('0.00'); // 3-point
        expect(sheet.cell('O9').style('numberFormat')).toBe('0.000'); // Direct assessment
    });

    it('should be idempotent (safe to run twice)', async () => {
        const service = new LabAttainmentService();
        
        // First run
        const firstRun = await service.generateAttainment(facultyBuffer);
        
        // Second run using the output of the first run
        const secondRun = await service.generateAttainment(firstRun.outputBuffer);
        
        expect(secondRun.report.success).toBe(true);
        expect(secondRun.report.studentCount).toBe(3);
        
        // Verify we only have 1 copy of tables
        const wb = await XlsxPopulate.fromDataAsync(secondRun.outputBuffer);
        const sheet = wb.sheet('Sheet1');
        expect(sheet.cell('P7').value()).toBeUndefined(); // Should not shift to the right
    });

    it('should throw on missing max marks', async () => {
        const service = new LabAttainmentService();
        const wb = await XlsxPopulate.fromBlankAsync();
        const sheet = wb.sheet(0);
        sheet.cell('D7').value('Internal'); // No number
        sheet.cell('E7').value('External'); // No number
        const badBuffer = await wb.outputAsync();

        await expect(service.generateAttainment(badBuffer)).rejects.toThrow('Could not extract maximum marks');
    });

    it('should reject invalid marks', async () => {
        const service = new LabAttainmentService();
        const wb = await XlsxPopulate.fromBlankAsync();
        const sheet = wb.sheet(0);
        sheet.cell('B7').value('Roll No.');
        sheet.cell('D7').value('Internal 30');
        sheet.cell('E7').value('External 70');
        sheet.cell('B9').value('123');
        sheet.cell('D9').value(35); // Exceeds max
        sheet.cell('E9').value(60); 
        const badBuffer = await wb.outputAsync();

        await expect(service.generateAttainment(badBuffer)).rejects.toThrow('exceeds maximum marks');
    });
});
