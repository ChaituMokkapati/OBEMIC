import * as fs from 'fs';
import * as path from 'path';
import { InternalAttainmentService } from '../src/services/attainment/internal/InternalAttainmentService';
const XlsxPopulate = require('xlsx-populate');

describe('Level 1: Internal Attainment Pipeline', () => {
    let facultyBuffer: Buffer;
    
    beforeAll(async () => {
        // Create a mock workbook in-memory that looks like the expected architecture
        const wb = await XlsxPopulate.fromBlankAsync();
        const sheet = wb.sheet(0);
        sheet.name('NM&TT (23ME3T01)');
        
        // Setup semantic headers
        sheet.cell('B8').value('Regd.No');
        sheet.cell('D7').value('MID-I');
        sheet.cell('D8').value('Descriptive');
        
        sheet.cell('L8').value('Unit Test');
        sheet.cell('M8').value('Objective-1');
        sheet.cell('N8').value('Assignment-1');
        sheet.cell('O8').value('Mid I Total');
        
        sheet.cell('P7').value('MID-II');
        sheet.cell('P8').value('Descriptive');
        
        sheet.cell('X8').value('Unit Test');
        sheet.cell('Y8').value('Objective-2');
        sheet.cell('Z8').value('Assignment-2');
        sheet.cell('AA8').value('Mid II Total');

        // Mid 1 questions
        sheet.cell('D9').value('Q1');
        sheet.cell('E9').value('Q2');
        sheet.cell('F9').value('Q3');
        sheet.cell('G9').value('Q4');
        sheet.cell('H9').value('Q5');
        sheet.cell('I9').value('Q6');

        // Mid 2 questions
        sheet.cell('P9').value('Q1');
        sheet.cell('Q9').value('Q2');
        sheet.cell('R9').value('Q3');
        sheet.cell('S9').value('Q4');
        sheet.cell('T9').value('Q5');
        sheet.cell('U9').value('Q6');
        
        // Mock Roll numbers
        sheet.cell('B12').value('22B81A0301');
        sheet.cell('B13').value('22B81A0302');
        sheet.cell('B14').value('22B81A0303');
        // Total 3 students -> End row = 14
        
        // Add random marks for the students
        for (let r = 12; r <= 14; r++) {
            sheet.cell(`D${r}`).value(10); // Mid 1 Q1
            sheet.cell(`E${r}`).value(8);  // Mid 1 Q2
            sheet.cell(`F${r}`).value(5);  // Mid 1 Q3
            sheet.cell(`G${r}`).value(5);  // Mid 1 Q4
            sheet.cell(`H${r}`).value(5);  // Mid 1 Q5
            sheet.cell(`I${r}`).value(5);  // Mid 1 Q6
            sheet.cell(`M${r}`).value(4);  // Mid 1 Objective
            
            sheet.cell(`P${r}`).value(9);  // Mid 2 Q1
            sheet.cell(`Q${r}`).value(7);  // Mid 2 Q2
            sheet.cell(`R${r}`).value(5);  // Mid 2 Q3
            sheet.cell(`S${r}`).value(5);  // Mid 2 Q4
            sheet.cell(`T${r}`).value(5);  // Mid 2 Q5
            sheet.cell(`U${r}`).value(5);  // Mid 2 Q6
            sheet.cell(`Y${r}`).value(5);  // Mid 2 Objective
        }
        
        facultyBuffer = await wb.outputAsync();

        // Print header columns for debugging
        const scanner = new (require('../src/services/attainment/shared/HeaderScanner').HeaderScanner)();
        const cols = scanner.scan(wb.sheet(0), 10, 30);
        console.log("SCANNED COLUMNS:");
        cols.forEach((c: any) => console.log(`Col ${c.colLetter}: ${c.path.join(' -> ')}`));
    });

    const mockCOs = [
        { coCode: 'CO1' },
        { coCode: 'CO2' },
        { coCode: 'CO3' },
        { coCode: 'CO4' },
        { coCode: 'CO5' }
    ];

    it('should successfully detect student range and generate reports', async () => {
        const service = new InternalAttainmentService();
        const { report } = await service.generateAttainment(facultyBuffer, 'NM&TT (23ME3T01)', mockCOs);
        
        expect(report.success).toBe(true);
        expect(report.studentCount).toBe(3); // Changed from 22 to 3
        expect(report.startRow).toBe(12);
        expect(report.endRow).toBe(14);      // Changed from 34 to 15
        expect(report.summaryStartRow).toBe(16); // Changed from 36 to 17
        
        // Ensure formulas were injected correctly for first and last student
        expect(report.firstStudentFormulas.CO1).toContain('ROUND');
        expect(report.lastStudentFormulas.CO5).toContain('ROUND');
    });

    it('should be idempotent (safe to run twice)', async () => {
        const service = new InternalAttainmentService();
        
        // First run
        const firstRun = await service.generateAttainment(facultyBuffer, 'NM&TT (23ME3T01)', mockCOs);
        
        // Second run using the output of the first run
        const secondRun = await service.generateAttainment(firstRun.outputBuffer, 'NM&TT (23ME3T01)', mockCOs);
        
        expect(secondRun.report.success).toBe(true);
        expect(secondRun.report.studentCount).toBe(3);
        expect(secondRun.report.startRow).toBe(12);
        expect(secondRun.report.endRow).toBe(14);
    });

    it('should correctly implement threshold configurability', async () => {
        const service = new InternalAttainmentService();
        
        // Generate with threshold 2.0
        const { report } = await service.generateAttainment(facultyBuffer, 'NM&TT (23ME3T01)', mockCOs, 2.0);
        
        expect(report.success).toBe(true);
        expect(report.threshold).toBe(2.0);
    });

    it('should handle edge cases without crashing (empty workbook)', async () => {
        const service = new InternalAttainmentService();
        // Passing an empty buffer should throw an error from xlsx-populate
        await expect(service.generateAttainment(Buffer.from([]), 'NM&TT (23ME3T01)', mockCOs)).rejects.toThrow();
    });
});
