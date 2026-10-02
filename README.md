<div align="center">
  <img src="frontend/public/logo.png" alt="OBEMIC Logo" width="120" height="120" style="border-radius: 20px;"/>
  <h1>🎓 OBEMIC: NBA Accreditation & OBE Engine</h1>
  <h3>Outcome-Based Education Management Information & Calculation</h3>
  <p><i>A complete, automated software solution for Engineering Institutions in India to achieve NBA / ABET Accreditation without the manual paperwork.</i></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.0+-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-7.9.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
</div>

---

## 📑 Table of Contents
1. [Project Overview for Stakeholders](#1-project-overview-for-stakeholders)
2. [The Three User Portals](#2-the-three-user-portals)
3. [How Attainment is Calculated (The Mathematics)](#3-how-attainment-is-calculated-the-mathematics)
4. [Frontend Architecture & User Experience](#4-frontend-architecture--user-experience)
5. [Backend Architecture: "Under the Hood"](#5-backend-architecture-under-the-hood)
6. [Database Schema & Structure](#6-database-schema--structure)
7. [Directory Structure](#7-directory-structure)
8. [Local Developer Setup Guide](#8-local-developer-setup-guide)

---

## 1. Project Overview for Stakeholders

Colleges and Universities seeking accreditation from the **National Board of Accreditation (NBA)** or **AICTE** are required to implement Outcome-Based Education (OBE). This means moving away from traditional grade-based marking and instead proving that students have successfully acquired specific skills and knowledge.

**OBEMIC** eliminates the need for faculty to manually maintain hundreds of complex Excel sheets. The system automatically calculates attainment levels, generates the required CO-PO mapping matrices, and produces formatted reports ready for the NBA committee's review.

### Key OBE Terminology Used in the System:
- **PEO (Program Educational Objectives):** What graduates are expected to achieve 3 to 5 years after graduation.
- **PO (Program Outcomes):** The 12 standard engineering attributes defined by the NBA (e.g., Engineering Knowledge, Problem Analysis, Ethics).
- **PSO (Program Specific Outcomes):** 2 to 4 outcomes specific to the department (e.g., specific to CSE, ECE, or Mechanical).
- **CO (Course Outcomes):** 5 to 6 specific learning objectives for a particular subject/course.

---

## 2. The Three User Portals

OBEMIC is designed with three separate interfaces to ensure that Management, Faculty, and Students only see what they need to see. 

### A. The Admin Control Center (For HODs & NBA Coordinators)
Accessed via `/admin`. Only authorized administrators and Heads of Departments can enter.
- **Academic Setup:** Easily create Academic Years, Semesters, and Departments.
- **Subject Management:** Define the Course Outcomes (COs) for every subject and map them to the 12 Program Outcomes (CO-PO Matrix).
- **Workload Allocation:** Assign faculty members to handle specific subjects and student batches/sections.
- **Survey Management:** Open and close the "Course End Surveys" for students at the end of the semester.

### B. The Faculty Dashboard (For Teaching Staff)
Accessed via `/faculty`. Designed to save hours of faculty time.
- **My Subjects:** Faculty will only see the subjects that the HOD has assigned to them.
- **Excel Upload Engine:** Faculty simply upload their standard marks sheets (Internal Mid-exams, University Externals, and Lab marks) in Excel format. The system instantly reads the marks and calculates the attainment automatically.
- **Visual Dashboards:** Instantly displays bar charts showing how well the class performed in each Course Outcome.
- **One-Click NBA Reports:** Generates a properly formatted, white-background PDF report containing all CO-PO calculations, ready to be printed and signed for the NBA file.

### C. Student Portal (For Course End Surveys)
Accessed via `/survey`. 
- **Simple Login:** Students log in securely using their University Roll Number.
- **Pending Surveys:** Students can see a list of subjects they need to provide feedback for.
- **Feedback Form:** A mobile-friendly screen where students rate their confidence in learning each Course Outcome on a scale of 1 to 5 (Poor to Excellent). This data is automatically sent to the Faculty Dashboard for "Indirect Attainment" calculation.

---

## 3. How Attainment is Calculated (The Mathematics)

OBEMIC strictly follows the mathematical models recommended by the NBA. The calculations are processed instantly by the backend system.

### A. Direct Attainment (Based on University & Mid Marks)
This measures actual academic performance through exams.
1. **The Target (Threshold):** For example, the department sets a target that students should score >= 60% of the maximum marks.
2. **Attainment Level (Linear Scale):** 
   Instead of rigid tiers, OBEMIC uses a precise **Direct Linear Proportional Scale** to be as fair and accurate as possible.

   **Attainment Level (Out of 3) = (Pass Percentage ÷ 100) × 3**
   
   *(Example: If 40% of the class passed the threshold, the attainment level is exactly 1.20)*

### B. Indirect Attainment (Based on Student Surveys)
This is calculated automatically from the Student Portal. The system takes the average of all 5-point ratings submitted by the students and scientifically scales it down to a standard 3-point level.

### C. Final CO Attainment
Both direct (exams) and indirect (surveys) results are combined. Typically, exam marks carry more weight:

**Final CO Attainment = (80% of Exam Score) + (20% of Survey Score)**

### D. PO Attainment (The Final Goal)
To find out how much a specific subject contributed to the overall engineering degree (Program Outcomes), the system checks the Correlation Factor set by the HOD (1 = Low, 2 = Medium, 3 = High) and calculates:

**PO Attainment = Average of (Final CO Score × Correlation Factor)**

---

## 4. Frontend Architecture & User Experience

The visual interface is built using modern technologies to ensure it is fast, responsive, and easy for non-technical staff to use.

### Technical Stack
- **Framework:** Next.js 14+ (React)
- **Styling:** Tailwind CSS for a clean, professional, and accessible design.
- **Charts:** Chart.js for rendering dynamic attainment graphs.

### Key Features for the End-User
1. **No Page Reloads:** The system uses React State Management, meaning navigating between subjects and uploading marks happens instantly without the web page needing to reload.
2. **Print-Optimized Reports:** When a faculty member clicks "Print", the system uses advanced CSS `@media print` rules. It hides the menus, removes the dark-mode colors, forces an A4 page width, and ensures the graphs are perfectly sized for a physical printer. 
3. **Secure Sessions:** If a faculty or admin leaves their desk and their session expires, the system automatically redirects them to the login screen to protect student data.

---

## 5. Backend Architecture: "Under the Hood"

The backend is completely separated from the frontend, ensuring high security and performance when processing large Excel files.

```mermaid
graph TD
    Client[Next.js Frontend] -->|API Requests| Router[Express Backend]
    
    subgraph OBEMIC Backend Node.js
        Router -->|Security Check| MW[Middlewares]
        MW --> Ctrl[Controllers]
        Ctrl --> Svc[Service Layer]
        
        subgraph Data Processing
            Svc --> Excel[Excel Parser]
            Svc --> Math[Attainment Engine]
        end
        
        Svc --> Repo[Database Layer]
        Repo --> Prisma[Prisma ORM]
    end
    
    Prisma <-->|Connection| DB[(PostgreSQL v16)]
```

### The 5 Layers of the Backend
1. **Routes:** Manages the URLs (e.g., `/api/faculty/upload`).
2. **Middleware:** Acts as a security guard. It ensures that students cannot access faculty routes, and verifies passwords.
3. **Controllers:** Receives the request from the user and hands it to the Service layer.
4. **Services (The Brain):** This is where the heavy lifting happens. It opens the uploaded Excel files, reads the student marks row-by-row, applies the NBA math formulas, and generates the final results.
5. **Repositories:** Safely saves the final calculated data into the PostgreSQL database.

---

## 6. Database Schema & Structure

Powered by PostgreSQL and Prisma ORM, the database is structured to mirror an Indian engineering college's hierarchy.

- **Hierarchy:** `Academic Year` $\rightarrow$ `Semester` $\rightarrow$ `Subject` $\rightarrow$ `Course Outcome`.
- **Faculty Assignment:** The most important table. It links a `Faculty Member` to a specific `Subject` and `Batch/Section` for a given year.
- **Reporting:** Stores the finalized attainment calculations so they can be reviewed and approved by the HOD.
- **Surveys:** Ensures that a student can only submit a survey for a subject exactly once.

---

## 7. Directory Structure

For the IT team, here is how the source code is organized:

```text
OBEMIC/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # The Database schema structure
│   │   └── seed.ts                  # Generates sample college data for testing
│   ├── src/
│   │   ├── controllers/             # Handles API requests and responses
│   │   ├── middleware/              # Security and file-upload checkers
│   │   ├── routes/                  # API endpoints
│   │   └── services/
│   │       ├── attainment/          # 🧠 The Mathematics and Excel parsing engine
│   │       └── *.service.ts         # Business logic for login, admin tasks, etc.
│   └── TEST/                        # Contains sample Excel templates for testing
│
└── frontend/
    ├── src/
    │   ├── app/                     # The visible web pages
    │   │   ├── admin/               # Admin Hub UI
    │   │   ├── faculty/             # Faculty Dashboard UI
    │   │   └── survey/[id]/         # Student Survey UI
    │   ├── components/              # Buttons, Charts, and Modals
    │   └── services/                # Connects the frontend to the backend API
    └── tailwind.config.ts           # UI colors and themes
```

---

## 8. Local Developer Setup Guide

If your IT team needs to set up the software on a local machine for testing or further development, follow these steps.

### Prerequisites
- **Node.js:** v20+ recommended.
- **PostgreSQL:** Running locally on port `5432`.

### 1. Database Configuration (Backend)
Inside the `backend/` folder, create a `.env` file and add your database credentials:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/obemic"
JWT_SECRET="your-secure-secret-key"
PORT=5000
```

### 2. Install & Prepare the Database
```bash
cd backend
npm install
npx prisma db push --force-reset
npx prisma generate
```

### 3. Generate Sample Data
Run this command to automatically create sample academic years, departments, an HOD, a faculty member, and students:
```bash
npx ts-node prisma/seed.ts
```

### 4. Start the Application

**Start the Backend Server:**
```bash
cd backend
npm run dev
```

**Start the Frontend Website:**
Open a new terminal window.
```bash
cd frontend
npm install
npm run dev
```

### 5. Access the System
- **Admin Hub:** Go to `http://localhost:3000/admin` *(Login with `admin@college.edu` / `password123`)*
- **Faculty Dashboard:** Go to `http://localhost:3000/faculty`
- **Student Survey Portal:** Go to `http://localhost:3000/survey`

Welcome to OBEMIC. 🚀
