"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import NaviOrb from "@/components/NaviOrb";

interface Props {
  petName: string;
  onClose: () => void;
}

type InputMode = "type" | "speak" | "upload";

interface FileData {
  name: string;
  mimeType: string;
  content: string;
  previewUrl?: string;
}

export default function HomeworkHelper({ petName, onClose }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>("type");
  const [question, setQuestion]   = useState("");
  const [file, setFile]           = useState<FileData | null>(null);
  const [response, setResponse]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Voice state
  const [isListening, setIsListening]       = useState(false);
  const isListeningRef                       = useRef(false); // stable ref for closures
  const [micMode, setMicMode]               = useState<"tap" | "hold">("tap");
  const [transcript, setTranscript]         = useState(""); // live display (final + interim)
  const [micError, setMicError]             = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef  = useRef<any>(null);
  const accumulatedRef  = useRef(""); // final text built up during a session

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check speech support on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setVoiceSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
  }, []);

  // ── Voice recognition ──────────────────────────────────────────────────────

  // Commit accumulated final text to the question field and reset session state
  const commitTranscript = useCallback(() => {
    const text = accumulatedRef.current.trim();
    accumulatedRef.current = "";
    setTranscript("");
    if (text) {
      setQuestion((prev) => (prev.trim() ? prev + " " + text : text));
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    commitTranscript();
  }, [commitTranscript]);

  const startListening = useCallback(() => {
    if (isListeningRef.current) return; // already running — no duplicate starts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    isListeningRef.current = true;
    setIsListening(true);
    setMicError(null);
    accumulatedRef.current = "";
    setTranscript("");

    // Inner function so onend can recursively restart using the same closure
    function createAndStart() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SR as any)();
      recognition.continuous     = true;  // keep alive until explicitly stopped
      recognition.interimResults = true;
      recognition.lang           = "en-US";
      recognitionRef.current     = recognition;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            accumulatedRef.current += e.results[i][0].transcript + " ";
          } else {
            interim += e.results[i][0].transcript;
          }
        }
        setTranscript((accumulatedRef.current + interim).trim());
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "permission-denied") {
          isListeningRef.current = false;
          setIsListening(false);
          setMicError("Microphone access denied. Please allow mic access in your browser settings.");
        }
        // Other transient errors (network, aborted) are handled by onend auto-restart
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          // Recognition ended unexpectedly — restart automatically
          setTimeout(createAndStart, 120);
        }
        // If isListeningRef.current is false, user stopped intentionally; no restart needed
      };

      try { recognition.start(); } catch { /* ignore already-started errors */ }
    }

    createAndStart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hold-to-talk handlers ──────────────────────────────────────────────────
  const handleHoldStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // prevent ghost click after touch
    startListening();
  }, [startListening]);

  const handleHoldEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isListeningRef.current) stopListening();
  }, [stopListening]);

  const handleTapToggle = useCallback(() => {
    if (isListeningRef.current) stopListening();
    else startListening();
  }, [startListening, stopListening]);

  // Stop recognition on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";

    const isText  = f.type === "text/plain"        || f.name.toLowerCase().endsWith(".txt");
    const isImage = f.type.startsWith("image/");
    const isPDF   = f.type === "application/pdf"   || f.name.toLowerCase().endsWith(".pdf");
    if (!isText && !isImage && !isPDF) return;

    if (isText) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setFile({ name: f.name, mimeType: "text/plain", content: (ev.target?.result as string) ?? "" });
      reader.readAsText(f);
    } else if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string ?? "";
        setFile({ name: f.name, mimeType: f.type, content: dataUrl, previewUrl: dataUrl });
      };
      reader.readAsDataURL(f);
    } else {
      setFile({ name: f.name, mimeType: "application/pdf", content: "" });
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!question.trim() && !file) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);

    let apiMessage =
      `[HOMEWORK HELPER]\n\n` +
      `You are a patient, encouraging tutor. Your job is NOT to give the answer directly. Instead:\n` +
      `- Break the problem into numbered steps (Step 1, Step 2…)\n` +
      `- Ask guiding questions that help the student think it through\n` +
      `- Explain the reasoning and concepts behind each step\n` +
      `- Praise effort; encourage the student to reach the answer themselves\n` +
      `- End with a follow-up question like "Does that make sense? Want to try the next step?"\n\n` +
      `Student's homework/question:\n${question.trim()}`;

    if (file?.mimeType === "text/plain" && file.content) {
      apiMessage += `\n\n[Homework document contents]:\n${file.content.slice(0, 4000)}`;
    } else if (file?.mimeType.startsWith("image/")) {
      apiMessage += `\n\n[Homework image attached: ${file.name}. Describe what you can see and help the student work through it.]`;
    } else if (file) {
      apiMessage += `\n\n[Document attached: ${file.name}. Help the student work through the content.]`;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: apiMessage,
          appMode: "companion",
          mentorMode: "learning",
          petName,
          mood: "happy",
          bondLevel: 2,
          bondName: "Friends",
          history: [],
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResponse(data.reply ?? "...");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = (question.trim().length > 0 || !!file) && !isLoading;

  const resetAll = () => {
    setResponse(null);
    setQuestion("");
    setFile(null);
    setTranscript("");
  };

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs: { id: InputMode; label: string; emoji: string }[] = [
    { id: "type",   label: "Type",   emoji: "⌨️" },
    { id: "speak",  label: "Speak",  emoji: "🎤" },
    { id: "upload", label: "Upload", emoji: "📤" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-overlay-in"
      style={{ background: "#08080f" }}
    >
      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(10,10,22,0.95)",
      }}>
        <button
          onClick={onClose}
          aria-label="Back"
          style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8", fontSize: 16, cursor: "pointer",
          }}
        >←</button>
        <div>
          <h1 style={{
            fontSize: 15, fontFamily: "monospace", fontWeight: "bold",
            color: "#e2e8f0", letterSpacing: "0.04em", margin: 0,
          }}>Homework Helper 📚</h1>
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", margin: 0 }}>
            {petName} guides you — no shortcuts, real learning
          </p>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>

        {/* Intro card */}
        <div style={{
          padding: "12px 14px", borderRadius: 12, marginBottom: 16,
          background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(168,85,247,0.06))",
          border: "1px solid rgba(0,212,255,0.15)",
        }}>
          <p style={{ fontSize: 12, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
            Choose how to share your question. {petName} will guide you <em style={{ color: "#00d4ff", fontStyle: "normal" }}>step-by-step</em> — not just hand you the answer.
          </p>
        </div>

        {/* ── Input mode tabs ── */}
        {!response && (
          <>
            <div style={{
              display: "flex", gap: 6, marginBottom: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: 4,
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInputMode(tab.id)}
                  style={{
                    flex: 1, padding: "9px 4px",
                    borderRadius: 9, cursor: "pointer",
                    fontFamily: "monospace", fontSize: 11, fontWeight: "bold",
                    letterSpacing: "0.05em",
                    transition: "all 0.2s ease",
                    background: inputMode === tab.id
                      ? "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(168,85,247,0.18))"
                      : "transparent",
                    border: inputMode === tab.id
                      ? "1px solid rgba(0,212,255,0.35)"
                      : "1px solid transparent",
                    color: inputMode === tab.id ? "#00d4ff" : "#475569",
                  }}
                >
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            {/* ── TYPE tab ── */}
            {inputMode === "type" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", color: "#475569", textTransform: "uppercase" }}>
                  Type your question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your homework question or describe the problem here..."
                  rows={5}
                  style={{
                    width: "100%", resize: "none",
                    padding: "12px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e2e8f0", fontSize: 13,
                    fontFamily: "monospace", lineHeight: 1.6,
                    caretColor: "#00d4ff", boxSizing: "border-box",
                  }}
                  className="focus:outline-none placeholder-slate-600"
                />
                {question.trim().length > 0 && (
                  <p style={{ fontSize: 10, fontFamily: "monospace", color: "#334155", margin: 0 }}>
                    {question.trim().length} chars · ready to ask {petName}
                  </p>
                )}
              </div>
            )}

            {/* ── SPEAK tab ── */}
            {inputMode === "speak" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {voiceSupported ? (
                  <>
                    {/* Mode selector: Tap vs Hold */}
                    <div style={{
                      display: "flex", gap: 6, padding: 4,
                      borderRadius: 10, background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      {(["tap", "hold"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => { if (isListeningRef.current) stopListening(); setMicMode(m); }}
                          style={{
                            flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                            fontSize: 11, fontFamily: "monospace", fontWeight: "bold", letterSpacing: "0.05em",
                            transition: "all 0.18s ease",
                            background: micMode === m
                              ? m === "tap" ? "rgba(0,212,255,0.12)" : "rgba(168,85,247,0.12)"
                              : "transparent",
                            border: micMode === m
                              ? m === "tap" ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(168,85,247,0.35)"
                              : "1px solid transparent",
                            color: micMode === m
                              ? m === "tap" ? "#00d4ff" : "#a855f7"
                              : "#475569",
                          }}
                        >
                          {m === "tap" ? "👆 Tap to Toggle" : "✊ Hold to Talk"}
                        </button>
                      ))}
                    </div>

                    {/* Mic button */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "20px 0 10px" }}>
                      <button
                        // Tap mode: toggle on click
                        onClick={micMode === "tap" ? handleTapToggle : undefined}
                        // Hold mode: start on press, stop on release
                        onMouseDown={micMode === "hold" ? handleHoldStart : undefined}
                        onMouseUp={micMode === "hold" ? handleHoldEnd : undefined}
                        onMouseLeave={micMode === "hold" && isListening ? handleHoldEnd : undefined}
                        onTouchStart={micMode === "hold" ? handleHoldStart : undefined}
                        onTouchEnd={micMode === "hold" ? handleHoldEnd : undefined}
                        aria-label={isListening ? "Stop recording" : "Start recording"}
                        style={{
                          width: 88, height: 88, borderRadius: "50%",
                          cursor: "pointer", fontSize: 36,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                          background: isListening
                            ? "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))"
                            : micMode === "hold"
                              ? "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))"
                              : "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))",
                          border: isListening
                            ? "2px solid rgba(239,68,68,0.7)"
                            : micMode === "hold"
                              ? "2px solid rgba(168,85,247,0.5)"
                              : "2px solid rgba(0,212,255,0.4)",
                          boxShadow: isListening
                            ? "0 0 36px rgba(239,68,68,0.45), 0 0 16px rgba(239,68,68,0.25)"
                            : micMode === "hold"
                              ? "0 0 20px rgba(168,85,247,0.2)"
                              : "0 0 16px rgba(0,212,255,0.15)",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          // Prevent hold from triggering text selection on long press
                          WebkitTouchCallout: "none",
                        } as React.CSSProperties}
                      >
                        {isListening ? "🔴" : "🎤"}
                      </button>

                      {/* Status label */}
                      <p style={{
                        fontSize: 12, fontFamily: "monospace", margin: 0,
                        letterSpacing: "0.08em", textAlign: "center",
                        color: isListening ? "#f87171" : micMode === "hold" ? "#a855f7" : "#475569",
                      }}>
                        {isListening
                          ? `Listening… ${micMode === "tap" ? "tap to stop" : "release to stop"}`
                          : micMode === "tap"
                            ? "Tap mic to start speaking"
                            : "Press & hold mic while speaking"}
                      </p>
                    </div>

                    {/* Permission / error message */}
                    {micError && (
                      <div style={{
                        padding: "10px 12px", borderRadius: 10,
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        fontSize: 11, fontFamily: "monospace", color: "#fca5a5", lineHeight: 1.6,
                      }}>
                        🚫 {micError}
                      </div>
                    )}

                    {/* Live transcript preview (while listening) */}
                    {isListening && transcript && (
                      <div style={{
                        padding: "10px 12px", borderRadius: 10,
                        background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
                        fontSize: 12, fontFamily: "monospace", color: "#fca5a5",
                        lineHeight: 1.65, fontStyle: "italic",
                      }}>
                        "{transcript}"
                      </div>
                    )}

                    {/* Editable result (after stopping) */}
                    {question && !isListening && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{
                          fontSize: 10, fontFamily: "monospace",
                          letterSpacing: "0.18em", color: "#475569", textTransform: "uppercase",
                        }}>
                          Your question — edit if needed
                        </label>
                        <textarea
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          rows={4}
                          style={{
                            width: "100%", resize: "none",
                            padding: "12px 14px", borderRadius: 12,
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(0,212,255,0.2)",
                            color: "#e2e8f0", fontSize: 13,
                            fontFamily: "monospace", lineHeight: 1.6,
                            caretColor: "#00d4ff", boxSizing: "border-box",
                          }}
                          className="focus:outline-none placeholder-slate-600"
                          placeholder="Your spoken question will appear here..."
                        />
                        <button
                          onClick={() => setQuestion("")}
                          style={{
                            alignSelf: "flex-end", padding: "4px 10px",
                            borderRadius: 8, fontSize: 10, fontFamily: "monospace",
                            cursor: "pointer", color: "#475569",
                            background: "none", border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* Idle help text */}
                    {!isListening && !question && !micError && (
                      <p style={{
                        fontSize: 10, fontFamily: "monospace", color: "#334155",
                        textAlign: "center", lineHeight: 1.65, margin: 0, padding: "0 8px",
                      }}>
                        {micMode === "tap"
                          ? "Tap the mic to start. Recording stays active until you tap again."
                          : "Press and hold the mic while speaking. Release when finished."}
                      </p>
                    )}
                  </>
                ) : (
                  <div style={{
                    padding: "20px", borderRadius: 12, textAlign: "center",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <p style={{ fontSize: 13, fontFamily: "monospace", color: "#64748b", margin: 0 }}>
                      🚫 Voice input isn't supported on this browser.<br />
                      <span style={{ fontSize: 11, color: "#334155" }}>Try Chrome or Edge, or use the Type tab.</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── UPLOAD tab ── */}
            {inputMode === "upload" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", color: "#475569", textTransform: "uppercase" }}>
                  Upload your homework file
                </label>

                {/* Drop zone */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 8,
                    padding: "28px 16px", borderRadius: 14, cursor: "pointer",
                    background: file ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: file ? "1px solid rgba(0,212,255,0.3)" : "2px dashed rgba(255,255,255,0.1)",
                    transition: "all 0.2s ease",
                    width: "100%", boxSizing: "border-box",
                  }}
                >
                  <span style={{ fontSize: 36 }}>{file ? "📎" : "📤"}</span>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: file ? "#00d4ff" : "#475569" }}>
                    {file ? file.name : "Tap to choose file"}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: "#334155" }}>
                    JPG · PNG · PDF · TXT
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.txt,image/jpeg,image/png,application/pdf,text/plain"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* File preview */}
                {file && (
                  <div style={{
                    borderRadius: 12, overflow: "hidden",
                    border: "1px solid rgba(0,212,255,0.2)",
                    background: "rgba(0,212,255,0.04)",
                  }}>
                    {/* File meta bar */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px",
                      borderBottom: file.previewUrl || (file.mimeType === "text/plain" && file.content)
                        ? "1px solid rgba(0,212,255,0.12)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>
                          {file.mimeType.startsWith("image/") ? "🖼️"
                            : file.mimeType === "application/pdf" ? "📄" : "📝"}
                        </span>
                        <div>
                          <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>{file.name}</p>
                          <p style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "#334155" }}>
                            {file.mimeType === "text/plain" ? "Text file"
                              : file.mimeType === "application/pdf" ? "PDF document"
                              : "Image"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        aria-label="Remove file"
                        style={{
                          width: 26, height: 26, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#64748b", fontSize: 11, cursor: "pointer",
                        }}
                      >✕</button>
                    </div>

                    {/* Image preview */}
                    {file.previewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        style={{ width: "100%", maxHeight: 200, objectFit: "contain", display: "block", background: "rgba(0,0,0,0.3)" }}
                      />
                    )}

                    {/* Text preview */}
                    {file.mimeType === "text/plain" && file.content && (
                      <div style={{
                        padding: "10px 14px", maxHeight: 120, overflowY: "auto",
                        fontSize: 11, fontFamily: "monospace", color: "#64748b",
                        lineHeight: 1.6, whiteSpace: "pre-wrap",
                      }}>
                        {file.content.slice(0, 600)}{file.content.length > 600 ? "\n…" : ""}
                      </div>
                    )}
                  </div>
                )}

                {/* Optional additional question */}
                <label style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", color: "#475569", textTransform: "uppercase", marginTop: 6 }}>
                  Add a question (optional)
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="E.g. 'Help me understand question 3' or 'What is this asking?'"
                  rows={3}
                  style={{
                    width: "100%", resize: "none",
                    padding: "12px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e2e8f0", fontSize: 13,
                    fontFamily: "monospace", lineHeight: 1.6,
                    caretColor: "#00d4ff", boxSizing: "border-box",
                  }}
                  className="focus:outline-none placeholder-slate-600"
                />
              </div>
            )}

            {/* ── Submit button ── */}
            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                marginTop: 14,
                width: "100%",
                padding: "13px",
                borderRadius: 12,
                fontSize: 13,
                fontFamily: "monospace",
                fontWeight: "bold",
                letterSpacing: "0.06em",
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.4,
                background: canSubmit
                  ? "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(168,85,247,0.18))"
                  : "rgba(255,255,255,0.03)",
                border: canSubmit
                  ? "1px solid rgba(0,212,255,0.4)"
                  : "1px solid rgba(255,255,255,0.07)",
                color: canSubmit ? "#00d4ff" : "#475569",
                transition: "all 0.2s ease",
              }}
            >
              {isLoading ? `${petName} is thinking…` : `Ask ${petName} 🧠`}
            </button>
          </>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{
            marginTop: 16,
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <NaviOrb size={32} />
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            marginTop: 12,
            padding: "12px 14px", borderRadius: 12,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5", fontSize: 12, fontFamily: "monospace",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Response ── */}
        {response && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <NaviOrb size={28} />
              <span style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                {petName} · Step-by-Step Guide
              </span>
            </div>

            <div style={{
              padding: "16px", borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(0,212,255,0.12)",
              fontSize: 13, fontFamily: "monospace",
              color: "#cbd5e1", lineHeight: 1.75,
              whiteSpace: "pre-wrap",
            }}>
              {response}
            </div>

            <button
              onClick={resetAll}
              style={{
                padding: "10px", borderRadius: 10, fontSize: 11,
                fontFamily: "monospace", cursor: "pointer",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#64748b",
              }}
            >
              Start a new question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
