"use client";

import CoursePanel from "./CoursePanel";
import { aiSkillsCourse } from "@/lib/courses/aiSkillsCourse";

export default function AiSkillsPanel({ onClose, onLevelComplete, studentName }) {
  return (
    <CoursePanel
      course={aiSkillsCourse}
      studentName={studentName}
      onClose={onClose}
      onLessonComplete={onLevelComplete}
    />
  );
}
