# Welcome to OBEMIC! 🚀
*(Onboarding Guide for the Database Management Team)*

Welcome to the team! We are building a powerful web application called **OBEMIC** (Outcome-Based Education Management & Information Control). As part of the Database Management team, your role is crucial. 

This guide is designed specifically for you. It explains what we are building, why it matters, and gives you a clear picture of how our database works (even if you only know basic SQL!).

---

## 1. What is OBE and Why do Colleges Need It? 🎓

### The Old Way vs. The OBE Way
In traditional education, a teacher teaches a syllabus, gives an exam, and if a student gets 40%, they pass. But this doesn't tell us *what* the student actually learned. Can they write code? Can they design a bridge? We don't know!

**OBE (Outcome-Based Education)** is a modern approach. Instead of just focusing on the syllabus, it focuses on the **Outcomes**—what the student should actually be able to do by the end of the course.

### Why is this required?
- **Accreditation (NBA/NAAC):** Top accrediting bodies (like the National Board of Accreditation in India) strictly require colleges to follow the OBE system. If a college doesn't prove they use OBE, they lose their accreditation and ranking!
- **Continuous Improvement:** It helps colleges identify exact weak points (e.g., "Students are good at theory, but failing at practical design") so they can improve their teaching methods.

---

## 2. How Does OBEMIC Work? (The Flow) 🔄

Our software automates the painful, manual calculations required for OBE. Here is the daily flow of the application:

1. **Admin Setup:** The Admin creates the college structure in the database (Departments, Academic Years, Semesters, and Subjects).
2. **Defining Course Outcomes (COs):** Every subject has 4 to 6 specific goals called "Course Outcomes". (e.g., CO1: "Understand basic thermodynamics", CO2: "Apply laws of physics to engines"). The Admin imports these into the DB.
3. **Faculty Uploads Marks:** A professor teaches a subject. After exams, they upload an Excel sheet containing student marks.
4. **The Magic Engine:** Our backend server takes that Excel file, reads the Database to see what Course Outcomes are mapped to that subject, and calculates the **Attainment Percentage** (how many students successfully achieved each outcome).
5. **Storage & Tracking:** The generated report is saved, and a record is logged in the Database so Coordinators can review it.

---

## 3. Database Guide for Juniors (SQL Made Easy) 🗄️

Since you know basic SQL, you are already halfway there! In this project, we use **PostgreSQL** as our database, but we use a tool called **Prisma** to interact with it. 

Think of Prisma as a translator. We write simple JavaScript/TypeScript, and Prisma translates it into the `SELECT`, `INSERT`, and `UPDATE` SQL queries you already know!

### The Core Tables You Should Know

Here are the most important tables in our database and what they do:

#### 1. `User` Table
Stores everyone who logs into the system (Admins, Faculty, Coordinators).
- **SQL Equivalent:** `CREATE TABLE "User" (id UUID, email VARCHAR, role VARCHAR...);`
- **What you'll see here:** Passwords are encrypted (hashed) for security. You'll never see a plain password, only random characters!

#### 2. `Subject` Table
Stores all the subjects taught in the college (e.g., "Probability & Statistics").
- **Relationships:** A Subject belongs to a `Department` and a `Semester`. (This is a standard Foreign Key relationship).

#### 3. `CourseOutcome` Table
Stores the 4 to 6 goals for each subject.
- **SQL Equivalent:** `SELECT * FROM "CourseOutcome" WHERE "subjectId" = '123';`
- **Relationship:** One-to-Many. One Subject has Many Course Outcomes.

#### 4. `FacultyAssignment` Table
This is a **Mapping Table** (or Junction Table). It connects a `User` (Faculty) to a `Subject`.
- If Dr. Kumar is teaching Physics, there is a row here linking his `userId` to the Physics `subjectId`.

#### 5. `ReportHistory` Table
Every time a professor generates an OBE Excel report, we insert a row here.
- It tracks the `status` (DRAFT, GENERATED, SUBMITTED) and the exact `filePath` where the Excel document is physically saved on the server.

### A Quick Example: Prisma vs SQL

If your boss asks you: *"Get me all the Course Outcomes for the subject code 23ME4T01."*

**How you would write it in SQL:**
```sql
SELECT co.* 
FROM "CourseOutcome" co
JOIN "Subject" s ON co."subjectId" = s.id
WHERE s."subjectCode" = '23ME4T01';
```

**How we write it in our backend code (Prisma):**
```javascript
const outcomes = await prisma.courseOutcome.findMany({
  where: {
    subject: {
      subjectCode: '23ME4T01'
    }
  }
});
```
*See? It's just a different way of writing the exact same logic!*

### Your Golden Rules for DB Management
1. **Never delete, only deactivate:** We use a concept called "Soft Deletes". Instead of running `DELETE FROM "User"`, we run `UPDATE "User" SET isDeleted = true`. This preserves historical records!
2. **Foreign Keys are your friends:** They prevent us from deleting a Department if there are still Subjects assigned to it.
3. **Check the Enums:** For columns like `status` or `role`, we use ENUMS (fixed lists of allowed words). A role can only be 'ADMIN', 'FACULTY', etc. Don't try to insert 'TEACHER'!

Welcome aboard! Take your time exploring the tables, and soon you'll be writing complex joins and managing the data like a pro. 🚀
