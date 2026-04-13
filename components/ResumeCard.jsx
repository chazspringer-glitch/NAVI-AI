"use client";

import { useState } from "react";
import { exportToPDF, PRINT_CSS } from "@/lib/exportToPDF";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSkills(raw) {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatExperience(raw) {
  const lower = raw.toLowerCase().trim();
  if (lower === "no experience yet" || lower === "none" || lower === "n/a" || lower === "") {
    return "Open to entry-level and first-time opportunities. Quick learner with a strong work ethic.";
  }
  return raw.trim();
}

// ── Plain-text version (for clipboard copy) ────────────────────────────────
function buildPlainText({ name, contact, skills, experience, about }) {
  const skillList = parseSkills(skills).map((s) => `• ${s}`).join("\n");
  const expText = formatExperience(experience);
  return [
    name.toUpperCase(),
    contact,
    "",
    "── SKILLS ──────────────────────────",
    skillList,
    "",
    "── EXPERIENCE ──────────────────────",
    expText,
    "",
    "── ABOUT ME ────────────────────────",
    about,
    "",
    "Created with NAVI Resume Builder",
  ].join("\n");
}

// ── HTML version (for print/PDF) ─────────────────────────────────────────────
function buildHTML({ name, contact, skills, experience, about }) {
  const skillTags = parseSkills(skills).map((s) => `<span class="skill-tag">${s}</span>`).join("");
  const expText = formatExperience(experience);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume – ${name}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <h1>${name}</h1>
  <div class="contact" style="font-size:12px;color:#555;margin-bottom:24px;">${contact}</div>

  <div class="section">
    <div class="section-title">Skills</div>
    <div>${skillTags}</div>
  </div>

  <div class="section">
    <div class="section-title">Experience</div>
    <p>${expText}</p>
  </div>

  <div class="section">
    <div class="section-title">About Me</div>
    <p>${about}</p>
  </div>

  <div class="footer">Created with NAVI Resume Builder</div>
</body>
</html>`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResumeCard({ data, onRestart, onClose }) {
  const [copied, setCopied] = useState(false);

  const { name, contact, skills, experience, about } = data;
  const skillList = parseSkills(skills);
  const expText = formatExperience(experience);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard
      const el = document.createElement("textarea");
      el.value = buildPlainText(data);
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    exportToPDF(buildHTML(data));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Success header */}
      <div className="flex flex-col items-center gap-1 py-3">
        <span style={{ fontSize: 32 }}>🎉</span>
        <span className="text-sm font-mono font-bold text-white">Your resume is ready!</span>
        <span className="text-xs font-mono text-slate-500">Tap the buttons below to save it</span>
      </div>

      {/* Resume card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Name + contact header */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,212,255,0.05)" }}
        >
          <div className="text-base font-mono font-bold text-white tracking-widest uppercase">
            {name}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">{contact}</div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Skills */}
          <div>
            <div
              className="text-[9px] font-mono tracking-[0.25em] uppercase mb-2"
              style={{ color: "#00d4ff", borderBottom: "1px solid rgba(0,212,255,0.15)", paddingBottom: 4 }}
            >
              Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillList.map((s, i) => (
                <span
                  key={i}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.18)", color: "#94d8ff" }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <div
              className="text-[9px] font-mono tracking-[0.25em] uppercase mb-2"
              style={{ color: "#a855f7", borderBottom: "1px solid rgba(168,85,247,0.15)", paddingBottom: 4 }}
            >
              Experience
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">{expText}</p>
          </div>

          {/* About Me */}
          <div>
            <div
              className="text-[9px] font-mono tracking-[0.25em] uppercase mb-2"
              style={{ color: "#4ade80", borderBottom: "1px solid rgba(74,222,128,0.15)", paddingBottom: 4 }}
            >
              About Me
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">{about}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-sm font-bold transition-all duration-200"
          style={{
            background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
            border: copied ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.1)",
            color: copied ? "#4ade80" : "#94a3b8",
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-sm font-bold transition-all duration-200"
          style={{
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.35)",
            color: "#00d4ff",
            boxShadow: "0 0 10px rgba(0,212,255,0.1)",
          }}
        >
          📥 Download PDF
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex gap-3 pb-2">
        <button
          onClick={onRestart}
          className="flex-1 py-2 rounded-xl font-mono text-xs transition-all duration-200"
          style={{ border: "1px solid rgba(255,255,255,0.07)", color: "rgba(100,116,139,0.8)" }}
        >
          ↺ Start Over
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-xl font-mono text-xs transition-all duration-200"
          style={{ border: "1px solid rgba(255,255,255,0.07)", color: "rgba(100,116,139,0.8)" }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
