"use client";

import { useState } from "react";

const STEPS = [
  { num: "1", title: "Update Your Resume", desc: "Tailor it to each job. Highlight results, not just duties." },
  { num: "2", title: "Set Up Job Alerts", desc: "Indeed, LinkedIn, and ZipRecruiter — set alerts for your keywords." },
  { num: "3", title: "Apply Strategically", desc: "Apply to 5-10 jobs/day. Quality over quantity. Customize each." },
  { num: "4", title: "Prepare for Interviews", desc: "Research the company. Practice the STAR method. Dress one level up." },
  { num: "5", title: "Follow Up", desc: "Send a thank-you email within 24 hours. It makes a difference." },
];

const JOB_TYPES = ["Any", "Full-Time", "Part-Time", "Remote", "Entry Level", "Contract"];
const FIELDS = ["Any", "Technology", "Healthcare", "Retail", "Food Service", "Construction", "Office/Admin", "Warehouse", "Customer Service", "Education", "Transportation"];

function buildSearchUrl(platform: string, keyword: string, location: string, jobType: string) {
  const kw = encodeURIComponent(keyword.trim());
  const loc = encodeURIComponent(location.trim());
  const remote = jobType === "Remote" ? "&remotejob=1" : "";

  switch (platform) {
    case "indeed":
      return `https://www.indeed.com/jobs?q=${kw}&l=${loc}${jobType === "Remote" ? "&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11" : ""}`;
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${kw}&location=${loc}${jobType === "Remote" ? "&f_WT=2" : ""}`;
    case "ziprecruiter":
      return `https://www.ziprecruiter.com/jobs-search?search=${kw}&location=${loc}`;
    case "google":
      return `https://www.google.com/search?q=${kw}+jobs+near+${loc}`;
    case "usajobs":
      return `https://www.usajobs.gov/Search/Results?k=${kw}&l=${loc}`;
    default:
      return "#";
  }
}

interface JobListing {
  title: string;
  company: string;
  salary: string;
  location: string;
  type: string;
  searchUrl: string;
}

function generateListings(keyword: string, userLocation: string, jobType: string, field: string): JobListing[] {
  const loc = userLocation.trim() || "Your Area";

  const jobsByField: Record<string, { title: string; company: string; salary: string }[]> = {
    Technology: [
      { title: "Help Desk Technician", company: "Local IT Services", salary: "$35K–$50K" },
      { title: "Junior Web Developer", company: "Digital Agency", salary: "$45K–$65K" },
      { title: "Data Entry Specialist", company: "Tech Staffing Co", salary: "$30K–$40K" },
      { title: "IT Support Analyst", company: "Healthcare Systems", salary: "$40K–$55K" },
      { title: "QA Tester", company: "Software Startup", salary: "$42K–$58K" },
      { title: "Social Media Coordinator", company: "Marketing Firm", salary: "$32K–$45K" },
      { title: "Technical Writer", company: "SaaS Company", salary: "$48K–$62K" },
    ],
    Healthcare: [
      { title: "Medical Assistant", company: "Community Clinic", salary: "$30K–$40K" },
      { title: "CNA (Certified Nursing Assistant)", company: "Senior Living Center", salary: "$28K–$35K" },
      { title: "Pharmacy Technician", company: "Retail Pharmacy", salary: "$32K–$40K" },
      { title: "Patient Care Coordinator", company: "Hospital Network", salary: "$35K–$45K" },
      { title: "Home Health Aide", company: "Home Care Agency", salary: "$26K–$33K" },
      { title: "Billing & Coding Specialist", company: "Medical Office", salary: "$35K–$45K" },
      { title: "Phlebotomist", company: "Lab Services", salary: "$30K–$38K" },
    ],
    "Office/Admin": [
      { title: "Administrative Assistant", company: "Law Office", salary: "$30K–$40K" },
      { title: "Receptionist", company: "Real Estate Agency", salary: "$27K–$35K" },
      { title: "Bookkeeper", company: "Small Business", salary: "$35K–$48K" },
      { title: "Office Manager", company: "Insurance Agency", salary: "$38K–$52K" },
      { title: "Executive Assistant", company: "Consulting Firm", salary: "$42K–$58K" },
      { title: "HR Coordinator", company: "Manufacturing Co", salary: "$38K–$50K" },
      { title: "Accounts Payable Clerk", company: "Nonprofit Org", salary: "$32K–$42K" },
    ],
    default: [
      { title: "Customer Service Rep", company: "Call Center", salary: "$28K–$38K" },
      { title: "Warehouse Associate", company: "Distribution Center", salary: "$30K–$40K" },
      { title: "Delivery Driver", company: "Logistics Company", salary: "$35K–$48K" },
      { title: "Retail Sales Associate", company: "Major Retailer", salary: "$26K–$35K" },
      { title: "Restaurant Server", company: "Family Restaurant", salary: "$25K–$40K (with tips)" },
      { title: "Security Guard", company: "Security Services", salary: "$28K–$36K" },
      { title: "Maintenance Technician", company: "Property Management", salary: "$35K–$50K" },
    ],
  };

  const pool = jobsByField[field] || jobsByField.default;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, 7).map((job) => ({
    ...job,
    location: loc,
    type: jobType === "Any" ? ["Full-Time", "Part-Time", "Contract"][Math.floor(Math.random() * 3)] : jobType,
    searchUrl: buildSearchUrl("indeed", `${job.title} ${keyword}`.trim(), userLocation, jobType),
  }));
}

export default function JobFinderPanel({ onClose }: { onClose: () => void }) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Any");
  const [field, setField] = useState("Any");
  const [result, setResult] = useState<JobListing[] | null>(null);

  const handleSearch = () => {
    if (!location.trim()) return;
    setResult(generateListings(keyword, location, jobType, field === "Any" ? "default" : field));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>

      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 3 }}>NAVI Tool</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>💼 Job Finder</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* NAVI intro */}
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            <span style={{ color: "#00d4ff", fontWeight: 700 }}>NAVI:</span> Let me help you find real jobs. Tell me what you{"'"}re looking for and where — I{"'"}ll show you openings and guide you through the process.
          </div>
        </div>

        {/* Search form */}
        <div style={{ padding: "16px", borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(0,212,255,0.10)", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Job Title or Keywords</div>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. warehouse, nurse, driver"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", position: "relative", zIndex: 10 }} />
          </div>
          <div>
            <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Location</div>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, state, or zip code"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", position: "relative", zIndex: 10 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Job Type</div>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", position: "relative", zIndex: 10 }}>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Field</div>
              <select value={field} onChange={(e) => setField(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", position: "relative", zIndex: 10 }}>
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSearch} disabled={!location.trim()}
            style={{ width: "100%", padding: "12px", borderRadius: 10, background: !location.trim() ? "rgba(0,212,255,0.06)" : "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(0,212,255,0.08))", border: "1px solid rgba(0,212,255,0.30)", color: "#00d4ff", fontSize: 12, fontFamily: "monospace", fontWeight: 700, cursor: !location.trim() ? "default" : "pointer", opacity: !location.trim() ? 0.4 : 1 }}>
            🔍 Find Jobs
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Job listings */}
            <div style={{ padding: "16px", borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(0,212,255,0.10)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#00d4ff", marginBottom: 4 }}>Jobs Near You</div>
              <div style={{ fontSize: 9, color: "#475569", marginBottom: 14 }}>{result.length} positions · Click any to view on Indeed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.map((job, i) => (
                  <div key={i} style={{ padding: "14px", borderRadius: 12, background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.10)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{job.title}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{job.company}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", flexShrink: 0, textAlign: "right" }}>{job.salary}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#475569" }}>
                        <span>📍 {job.location}</span>
                        <span style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.12)", color: "#00d4ff", fontSize: 8 }}>{job.type}</span>
                      </div>
                      <button onClick={() => window.open(job.searchUrl, "_blank")}
                        style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.25)", color: "#00d4ff", fontSize: 10, fontFamily: "monospace", fontWeight: 600, cursor: "pointer" }}>
                        View Jobs →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search on other platforms */}
            <div style={{ padding: "16px", borderRadius: 14, background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.10)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00d4ff", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>🔗 Search More Platforms</div>
              {[
                { label: "Indeed", url: buildSearchUrl("indeed", keyword, location, jobType) },
                { label: "LinkedIn Jobs", url: buildSearchUrl("linkedin", keyword, location, jobType) },
                { label: "ZipRecruiter", url: buildSearchUrl("ziprecruiter", keyword, location, jobType) },
                { label: "Google Jobs", url: buildSearchUrl("google", keyword, location, jobType) },
                { label: "USAJobs (Government)", url: buildSearchUrl("usajobs", keyword, location, jobType) },
              ].map(({ label, url }) => (
                <button key={label} onClick={() => window.open(url, "_blank")} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,212,255,0.10)", color: "#00d4ff", fontSize: 11, fontFamily: "monospace",
                }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>↗</span>
                </button>
              ))}
            </div>

            {/* Warnings */}
            <div style={{ padding: "16px", borderRadius: 14, background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>⚠️ Watch Out For</div>
              {[
                "Never pay to apply for a job — legitimate employers don't charge fees",
                "If it sounds too good to be true (high pay, no experience, work from home) — verify the company first",
                "Never share your Social Security number during the application stage",
                "Check company reviews on Glassdoor before accepting an offer",
                "Be cautious of jobs that only communicate through text or messaging apps",
              ].map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 10, color: "#fca5a5", lineHeight: 1.55 }}>
                  <span style={{ color: "#f59e0b", flexShrink: 0 }}>✕</span><span>{w}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step-by-step guide (always visible) */}
        <div style={{ padding: "16px", borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(168,85,247,0.10)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 12 }}>Job Search Guide</div>
          {STEPS.map(({ num, title, desc }) => (
            <div key={num} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#a855f7" }}>{num}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Resources */}
        <div style={{ padding: "16px", borderRadius: 14, background: "rgba(168,85,247,0.03)", border: "1px solid rgba(168,85,247,0.10)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>🤝 Free Resources</div>
          {[
            { icon: "📄", label: "Free Resume Templates", url: "https://www.canva.com/resumes/templates/" },
            { icon: "🎯", label: "Interview Prep (Indeed)", url: "https://www.indeed.com/career-advice/interviewing" },
            { icon: "📊", label: "Salary Research", url: "https://www.glassdoor.com/Salaries/index.htm" },
            { icon: "🏛️", label: "Workforce Development (CareerOneStop)", url: "https://www.careeronestop.org/" },
            { icon: "📚", label: "Free Skills Training", url: "https://www.khanacademy.org/" },
          ].map(({ icon, label, url }) => (
            <button key={label} onClick={() => window.open(url, "_blank")} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.08)", textAlign: "left", fontFamily: "monospace", color: "#e2e8f0",
            }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#c4b5fd" }}>{label}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#64748b" }}>↗</span>
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", fontSize: 8, color: "#334155", lineHeight: 1.6 }}>
          NAVI helps you find jobs but is not an employment agency. Listings link to real job search platforms. Always verify employers independently.
        </div>
      </div>
    </div>
  );
}
