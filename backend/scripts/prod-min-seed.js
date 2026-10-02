const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const q = (t, p) => pool.query(t, p);
  const hash = await bcrypt.hash('password123', 10);
  const studentHash = await bcrypt.hash('student@123', 10);

  for (const role of ['FACULTY', 'ADMIN', 'COORDINATOR', 'MANAGEMENT']) {
    await q(
      'INSERT INTO "Role" (id, "roleName", "createdAt", "updatedAt") VALUES ($1,$2,NOW(),NOW()) ON CONFLICT ("roleName") DO NOTHING',
      [randomUUID(), role]
    );
  }

  const adminRole = (await q('SELECT id FROM "Role" WHERE "roleName"=$1', ['ADMIN'])).rows[0];
  const facultyRole = (await q('SELECT id FROM "Role" WHERE "roleName"=$1', ['FACULTY'])).rows[0];

  await q(
    'INSERT INTO "Department" (id, "departmentName", "createdAt", "updatedAt") VALUES ($1,$2,NOW(),NOW()) ON CONFLICT ("departmentName") DO NOTHING',
    [randomUUID(), 'CSE']
  );
  const dept = (await q('SELECT id FROM "Department" WHERE "departmentName"=$1', ['CSE'])).rows[0];

  async function upsertUser(name, email, roleId) {
    const ex = (await q('SELECT id FROM "User" WHERE email=$1', [email])).rows[0];
    if (ex) {
      await q(
        'UPDATE "User" SET "passwordHash"=$1, "roleId"=$2, status=$3, "updatedAt"=NOW() WHERE email=$4',
        [hash, roleId, 'ACTIVE', email]
      );
    } else {
      await q(
        'INSERT INTO "User" (id, name, email, "passwordHash", "roleId", "departmentId", status, "mustChangePassword", "isDeleted", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,false,false,NOW(),NOW())',
        [randomUUID(), name, email, hash, roleId, dept.id, 'ACTIVE']
      );
    }
  }

  await upsertUser('System Admin', 'admin@college.edu', adminRole.id);
  await upsertUser('John Doe', 'faculty@college.edu', facultyRole.id);

  for (const s of [
    { r: '22ME001', n: 'Rahul Kumar' },
    { r: '22ME002', n: 'Priya Sharma' },
    { r: '22ME003', n: 'Arjun Reddy' },
    { r: '22ME004', n: 'Sneha Patel' },
    { r: '22ME005', n: 'Vikram Singh' },
  ]) {
    const ex = (await q('SELECT id FROM "Student" WHERE "rollNumber"=$1', [s.r])).rows[0];
    if (ex) {
      await q('UPDATE "Student" SET "passwordHash"=$1, "updatedAt"=NOW() WHERE "rollNumber"=$2', [
        studentHash,
        s.r,
      ]);
    } else {
      await q(
        'INSERT INTO "Student" (id, "rollNumber", name, "passwordHash", "isDeleted", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,false,NOW(),NOW())',
        [randomUUID(), s.r, s.n, studentHash]
      );
    }
  }

  console.log('Minimal seed OK: admin@college.edu / password123');
  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
