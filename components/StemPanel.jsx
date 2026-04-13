"use client";

import CoursePanel from "./CoursePanel";
import { stemCourse } from "@/lib/courses/stemCourse";

export default function StemPanel({ onClose, onLevelComplete, studentName }) {
  return (
    <CoursePanel
      course={stemCourse}
      studentName={studentName}
      onClose={onClose}
      onLessonComplete={onLevelComplete}
    />
  );
}
