// ── Course type definitions ────────────────────────────────────────────────────
// Shared across STEM Explorer and AI Skills courses.

export interface LearningObjective {
  id: string;
  text: string;
}

export interface CourseTask {
  instruction: string;
  hint: string;
}

export interface Lesson {
  id: string;       // e.g. "1-1", "2-3"
  title: string;
  duration: string; // e.g. "10 min"
  objectives: LearningObjective[];
  concepts: string[]; // key learning points shown as bullets
  task: CourseTask;
  xp: number;
}

export interface CourseModule {
  id: string;       // e.g. "1", "2"
  number: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  glow: string;
  lessons: Lesson[];
  completionXP: number; // bonus XP for finishing all lessons in this module
}

export interface Course {
  id: string;         // "stem" | "ai_skills"
  title: string;
  subtitle: string;
  description: string;
  audience: string;
  duration: string;   // total estimated time
  icon: string;
  color: string;
  glow: string;
  modules: CourseModule[];
  completionXP: number; // bonus XP for finishing the whole course
  certTitle: string;
  certBody: string;
}

// ── Progress data ─────────────────────────────────────────────────────────────
// Stored in localStorage; structured for future server sync.

export interface LessonCompletion {
  completedAt: number;   // Unix ms
  taskResponse: string;
  xpAwarded: number;
}

export interface CourseProgressData {
  courseId: string;
  studentName: string;
  startedAt: number;
  completedAt: number | null;
  certificateId: string | null;
  totalXP: number;
  lessons: Record<string, LessonCompletion>; // lessonId → completion
}

// ── Admin report shape (prep for teacher dashboard) ───────────────────────────
export interface CourseReport {
  courseId: string;
  courseTitle: string;
  studentName: string;
  startedAt: string;        // ISO date
  completedAt: string | null;
  certificateId: string | null;
  percentComplete: number;
  totalXP: number;
  moduleProgress: {
    moduleId: string;
    moduleTitle: string;
    lessonsComplete: number;
    totalLessons: number;
    complete: boolean;
  }[];
  lessonDetails: {
    lessonId: string;
    lessonTitle: string;
    completedAt: string | null;
    xpAwarded: number;
    taskResponse: string;
  }[];
}
