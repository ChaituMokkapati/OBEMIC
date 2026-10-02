import { ExternalAttainmentService } from '../src/services/attainment/external/ExternalAttainmentService';
const XlsxPopulate = require('xlsx-populate');

describe('Level 2: External Attainment Pipeline', () => {
    let facultyBuffer: Buffer;
    
    beforeAll(async () => {
        // Create a mock workbook for External
        const wb = await XlsxPopulate.fromBlankAsync();
        const sheet = wb.sheet(0);
        sheet.name('B.Tech II-II');

        // Setup semantic headers (Row 1, 2, 3)
        sheet.cell('B3').value('Regd.No');
        
        // CO1
        sheet.cell('E1').value('PART A');
        sheet.cell('E2').value('PART A CO1');
        sheet.cell('E3').value('a');
        sheet.cell('F3').value('b');
        
        sheet.cell('G1').value('PART B');
        sheet.cell('G2').value('PART B CO1');
        sheet.cell('G3').value('1');
        sheet.cell('H3').value('2');

        // CO2
        sheet.cell('I1').value('PART A');
        sheet.cell('I2').value('PART A CO2');
        sheet.cell('I3').value('C');
        sheet.cell('J3').value('D');
        
        sheet.cell('K1').value('PART B');
        sheet.cell('K2').value('PART B CO2');
        sheet.cell('K3').value('3');
        sheet.cell('L3').value('4');

        // Add students and marks
        for (let r = 5; r <= 7; r++) {
            sheet.cell(`B${r}`).value(`21B91A040${r - 4}`); // 10 chars

            // CO1
            sheet.cell(`E${r}`).value(2);  // a
            sheet.cell(`F${r}`).value(2);  // b
            sheet.cell(`G${r}`).value(8);  // Q1
            sheet.cell(`H${r}`).value(5);  // Q2

            // CO2
            sheet.cell(`I${r}`).value(3);  // a
            sheet.cell(`J${r}`).value(3);  // b
            sheet.cell(`K${r}`).value(7);  // Q1
            sheet.cell(`L${r}`).value(6);  // Q2
        }

        // Add a student with AB
        sheet.cell(`B8`).value(`21B91A0404`);
        sheet.cell(`E8`).value('AB');
        sheet.cell(`F8`).value('AB');
        sheet.cell(`G8`).value('AB');
        sheet.cell(`H8`).value('AB');

        sheet.cell(`I8`).value('AB');
        sheet.cell(`J8`).value('AB');
        sheet.cell(`K8`).value('AB');
        sheet.cell(`L8`).value('AB');
        
        facultyBuffer = await wb.outputAsync();
    });

    const mockCOs = [
        { coCode: 'CO1' },
        { coCode: 'CO2' }
    ];

    it('should successfully map external columns and generate attainment', async () => {
        const service = new ExternalAttainmentService();
        const { report } = await service.generateAttainment(facultyBuffer, 'B.Tech II-II', mockCOs);
        
        expect(report.success).toBe(true);
        expect(report.studentCount).toBe(4);
        expect(report.startRow).toBe(5);
        expect(report.endRow).toBe(8);
        expect(report.summaryStartRow).toBe(10);
        
        // Assert formula injected
        expect(report.firstStudentFormulas.CO1).toContain('ROUND');
        expect(report.firstStudentFormulas.CO1).toContain('MAX');
    });

    it('should throw an error if a mixture of 0 and AB is detected', async () => {
        const wb = await XlsxPopulate.fromDataAsync(facultyBuffer);
        const sheet = wb.sheet(0);
        // Introduce a mixture
        sheet.cell('E8').value('AB');
        sheet.cell('F8').value(5); // mixture!

        const badBuffer = await wb.outputAsync();
        
        const service = new ExternalAttainmentService();
        await expect(service.generateAttainment(badBuffer, 'B.Tech II-II', mockCOs)).rejects.toThrow(/INVALID_EXTERNAL_MARKS_DATA: Impossible mixture/);
    });
});
