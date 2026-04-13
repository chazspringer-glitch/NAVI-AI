import type { Course, CourseProgressData, LessonCompletion, CourseReport } from "./courseTypes";

// ── Storage ────────────────────────────────────────────────────────────────────

function storageKey(courseId: string): string {
  return `navi-course-v1-${courseId}`;
}

export function loadCourseProgress(courseId: string): CourseProgressData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(courseId));
    return raw ? (JSON.parse(raw) as CourseProgressData) : null;
  } catch {
    return null;
  }
}

export function saveCourseProgress(data: CourseProgressData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.courseId), JSON.stringify(data));
  } catch { /* ignore */ }
}

export function initCourseProgress(courseId: string, studentName: string): CourseProgressData {
  return {
    courseId,
    studentName,
    startedAt: Date.now(),
    completedAt: null,
    certificateId: null,
    totalXP: 0,
    lessons: {},
  };
}

// ── Lesson helpers ─────────────────────────────────────────────────────────────

export function completeLesson(
  progress: CourseProgressData,
  lessonId: string,
  taskResponse: string,
  xp: number,
): CourseProgressData {
  const completion: LessonCompletion = {
    completedAt: Date.now(),
    taskResponse,
    xpAwarded: xp,
  };
  return {
    ...progress,
    totalXP: progress.totalXP + xp,
    lessons: { ...progress.lessons, [lessonId]: completion },
  };
}

// ── Progress calculations ──────────────────────────────────────────────────────

export function getLessonIds(course: Course): string[] {
  return course.modules.flatMap((m) => m.lessons.map((l) => l.id));
}

export function getCompletedCount(course: Course, progress: CourseProgressData): number {
  return getLessonIds(course).filter((id) => progress.lessons[id]?.completedAt).length;
}

export function getPercentComplete(course: Course, progress: CourseProgressData): number {
  const total = getLessonIds(course).length;
  if (total === 0) return 0;
  return Math.round((getCompletedCount(course, progress) / total) * 100);
}

export function isModuleComplete(
  module: Course["modules"][0],
  progress: CourseProgressData,
): boolean {
  return module.lessons.every((l) => !!progress.lessons[l.id]?.completedAt);
}

export function isCourseComplete(course: Course, progress: CourseProgressData): boolean {
  return course.modules.every((m) => isModuleComplete(m, progress));
}

/** First lesson is always unlocked; each subsequent lesson requires the previous one done. */
export function isLessonUnlocked(
  course: Course,
  lessonId: string,
  progress: CourseProgressData,
): boolean {
  const allLessons = getLessonIds(course);
  const idx = allLessons.indexOf(lessonId);
  if (idx <= 0) return true;
  const prevId = allLessons[idx - 1];
  return !!progress.lessons[prevId]?.completedAt;
}

// ── Certificate ────────────────────────────────────────────────────────────────

export function generateCertificateId(courseId: string, studentName: string): string {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const namePart = (studentName || "USER").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${courseId.replace("_", "").toUpperCase()}-${datePart}-${namePart}${rand}`;
}

export function finalizeCourse(
  course: Course,
  progress: CourseProgressData,
): CourseProgressData {
  if (progress.completedAt) return progress; // already finalized
  const certId = generateCertificateId(course.id, progress.studentName);
  return {
    ...progress,
    completedAt: Date.now(),
    certificateId: certId,
    totalXP: progress.totalXP + course.completionXP,
  };
}

// ── Admin report ───────────────────────────────────────────────────────────────
// Returns a structured object suitable for export to a teacher dashboard.

export function getCourseReport(course: Course, progress: CourseProgressData): CourseReport {
  const totalLessons = getLessonIds(course).length;
  const completedCount = getCompletedCount(course, progress);

  return {
    courseId: course.id,
    courseTitle: course.title,
    studentName: progress.studentName || "Unknown",
    startedAt: new Date(progress.startedAt).toISOString(),
    completedAt: progress.completedAt ? new Date(progress.completedAt).toISOString() : null,
    certificateId: progress.certificateId,
    percentComplete: Math.round((completedCount / totalLessons) * 100),
    totalXP: progress.totalXP,
    moduleProgress: course.modules.map((mod) => ({
      moduleId: mod.id,
      moduleTitle: mod.title,
      lessonsComplete: mod.lessons.filter((l) => !!progress.lessons[l.id]?.completedAt).length,
      totalLessons: mod.lessons.length,
      complete: isModuleComplete(mod, progress),
    })),
    lessonDetails: course.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => {
        const comp = progress.lessons[lesson.id];
        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completedAt: comp ? new Date(comp.completedAt).toISOString() : null,
          xpAwarded: comp?.xpAwarded ?? 0,
          taskResponse: comp?.taskResponse ?? "",
        };
      })
    ),
  };
}
