# The OBEMIC Project: A Simple Guide for Beginners 🌟

Welcome to the Database Team! If you are new to this project, don't worry. This guide will explain everything you need to know in plain and simple English.

---

## 1. What is OBE? (And why do we need it?)

**The Problem:** Normally, a teacher teaches a class and gives a test. If a student gets a 50%, they pass. But wait—do they actually know how to build a motor? Do they know how to write a software program? A simple test score doesn't tell us *what* they actually learned to do.

**The Solution:** **OBE** stands for **Outcome-Based Education**. 
Instead of just looking at test scores, OBE looks at specific **"Outcomes"** (goals). 
For example: 
- Goal 1: The student can explain basic physics.
- Goal 2: The student can build a small machine.

**Why colleges need it:** Government boards (like NBA) force colleges to use this system. If a college cannot prove they track these specific goals, they can lose their license and reputation!

---

## 2. How Our Software Works (The Big Picture) 🖼️

Our software, **OBEMIC**, does all the hard math for the teachers. Here is the step-by-step flow:

1. **The Setup:** The College Admin creates the Subjects (like Math or Physics) in our database.
2. **The Goals:** The Admin adds 4 or 5 specific goals (called "Course Outcomes") for each subject.
3. **The Teacher Uploads:** A teacher finishes grading their students. They log into our website and upload an Excel file with the students' marks.
4. **The Magic:** Our system reads the Excel file, connects it to the goals in the database, and automatically creates a massive report showing exactly how many students achieved the goals!

---

## 3. Database Basics (For SQL Beginners) 🗄️

You already know basic SQL like `SELECT * FROM table`. Here is how our database is organized:

### The Main Tables

1. **`User` Table:** 
   This holds the accounts for everyone who logs in (Admins, Teachers, etc.). Passwords here are scrambled for safety.
2. **`Subject` Table:** 
   This is just a list of all the classes the college offers.
3. **`CourseOutcome` Table:** 
   This holds the "goals" we talked about earlier. Every Goal belongs to a specific Subject.
4. **`FacultyAssignment` Table:** 
   This is a bridge. It simply connects a Teacher (from the User table) to the Subject they are teaching.
5. **`ReportHistory` Table:** 
   Every time a teacher generates a report, we save a record of it here so they can download it later.

### How We Write SQL in This Project

In this project, we don't write raw SQL code like `SELECT * FROM Subject`. Instead, we use a tool called **Prisma**.

Prisma is like a friendly translator. We write a simple command, and Prisma turns it into SQL for the database.

**In normal SQL, you write:**
```sql
SELECT * FROM "Subject" WHERE "subjectCode" = 'MATH101';
```

**With Prisma, you write:**
```javascript
const subject = await prisma.subject.findMany({
  where: { subjectCode: 'MATH101' }
});
```
It is exactly the same thing, just written slightly differently!

### 3 Simple Rules to Remember
1. **We never delete data.** If someone makes a mistake, we don't use the `DELETE` command. We just mark it as `isDeleted = true`. This keeps our history safe!
2. **Everything is connected.** You cannot delete a Subject if there are still Goals attached to it.
3. **Take it slow!** You will learn more every day. If you can write a `SELECT` statement, you have the skills to learn Prisma!

Welcome to the team! 🚀
