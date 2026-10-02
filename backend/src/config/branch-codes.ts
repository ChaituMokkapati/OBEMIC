export interface DepartmentCodeConfig {
  departmentCode: string;
  subjectCodeToken: string;
  departmentName: string;
  aliases: string[];
}

export const DEPARTMENT_CONFIGS: DepartmentCodeConfig[] = [
  {
    departmentCode: 'CSE',
    subjectCodeToken: 'CS',
    departmentName: 'Computer Science and Engineering',
    aliases: ['CSE', 'COMPUTER SCIENCE AND ENGINEERING', 'COMPUTER SCIENCE ENGINEERING', 'COMPUTER SCIENCE'],
  },
  {
    departmentCode: 'IT',
    subjectCodeToken: 'IT',
    departmentName: 'Information Technology',
    aliases: ['IT', 'INFORMATION TECHNOLOGY'],
  },
  {
    departmentCode: 'AIDS',
    subjectCodeToken: 'DS',
    departmentName: 'Artificial Intelligence and Data Science',
    aliases: ['AIDS', 'AI&DS', 'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE', 'AI AND DS', 'AI & DS'],
  },
  {
    departmentCode: 'AIML',
    subjectCodeToken: 'ML',
    departmentName: 'Artificial Intelligence and Machine Learning',
    aliases: ['AIML', 'AI&ML', 'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING', 'AI AND ML', 'AI & ML'],
  },
  {
    departmentCode: 'ECE',
    subjectCodeToken: 'EC',
    departmentName: 'Electronics and Communication Engineering',
    aliases: ['ECE', 'ELECTRONICS AND COMMUNICATION ENGINEERING', 'ELECTRONICS & COMMUNICATION ENGINEERING'],
  },
  {
    departmentCode: 'EEE',
    subjectCodeToken: 'EE',
    departmentName: 'Electrical and Electronics Engineering',
    aliases: ['EEE', 'ELECTRICAL AND ELECTRONICS ENGINEERING', 'ELECTRICAL & ELECTRONICS ENGINEERING'],
  },
  {
    departmentCode: 'CIVIL',
    subjectCodeToken: 'CV',
    departmentName: 'Civil Engineering',
    aliases: ['CIVIL', 'CE', 'CIVIL ENGINEERING'],
  },
  {
    departmentCode: 'MECH',
    subjectCodeToken: 'ME',
    departmentName: 'Mechanical Engineering',
    aliases: ['MECH', 'ME', 'MECHANICAL ENGINEERING', 'MECHANICAL'],
  },
];

/**
 * Resolves a canonical Department Code from a raw string (e.g. from an Excel heading)
 * Uses exact matching on code or aliases after trimming and converting to uppercase.
 */
export function resolveDepartmentCodeByAlias(rawString: string): DepartmentCodeConfig | null {
  if (!rawString) return null;
  const normalized = rawString.trim().toUpperCase();
  
  return DEPARTMENT_CONFIGS.find(
    config => 
      config.departmentCode === normalized || 
      config.aliases.includes(normalized)
  ) || null;
}

/**
 * Resolves a Department Code Config based on the extracted subject code token (e.g. "ME")
 */
export function resolveDepartmentConfigBySubjectToken(token: string): DepartmentCodeConfig | null {
  if (!token) return null;
  const normalized = token.trim().toUpperCase();
  
  return DEPARTMENT_CONFIGS.find(config => config.subjectCodeToken === normalized) || null;
}
