-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PREVIEW', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfigScope" AS ENUM ('GLOBAL', 'DEPARTMENT', 'ACADEMIC_YEAR', 'SEMESTER', 'SUBJECT');

-- AlterTable
ALTER TABLE "FacultyAssignment" ADD COLUMN     "assignedBy" TEXT,
ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "unassignedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "regulationId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Regulation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Regulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "facultyCode" TEXT,
    "designation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "importType" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PREVIEW',
    "importedBy" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttainmentConfiguration" (
    "id" TEXT NOT NULL,
    "scopeType" "ConfigScope" NOT NULL,
    "departmentId" TEXT,
    "academicYearId" TEXT,
    "semesterId" TEXT,
    "subjectId" TEXT,
    "threshold" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttainmentConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttainmentThresholdHistory" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "oldThreshold" DOUBLE PRECISION,
    "newThreshold" DOUBLE PRECISION NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttainmentThresholdHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Regulation_name_key" ON "Regulation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_facultyCode_key" ON "FacultyProfile"("facultyCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttainmentConfiguration" ADD CONSTRAINT "AttainmentConfiguration_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttainmentConfiguration" ADD CONSTRAINT "AttainmentConfiguration_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttainmentConfiguration" ADD CONSTRAINT "AttainmentConfiguration_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttainmentConfiguration" ADD CONSTRAINT "AttainmentConfiguration_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttainmentConfiguration" ADD CONSTRAINT "AttainmentConfiguration_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttainmentThresholdHistory" ADD CONSTRAINT "AttainmentThresholdHistory_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "AttainmentConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttainmentThresholdHistory" ADD CONSTRAINT "AttainmentThresholdHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
