"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// EDIT THIS LIST to add / update books.
//   • cover:       Public image URL (Amazon cover, Supabase Storage, etc.).
//                  Leave empty to show a gold-gradient placeholder.
//   • title:       Book title as it should appear on the card.
//   • description: One or two sentences pitching the book.
//   • price:       String — whatever you want shown (e.g. "$19.99", "From $12").
//   • url:         Full Amazon product URL. Opens in a new tab.
//   • accent:      Optional hex color for the card glow. Defaults to gold.
// ─────────────────────────────────────────────────────────────────────────────
type Book = {
  cover: string;
  title: string;
  description: string;
  price: string;
  url: string;
  accent?: string;
};

const BOOKS: Book[] = [
  {
    cover: "",
    title: "Book Title #1",
    description: "Short blurb about what this book teaches and who it's for. Replace this copy with the real back-cover pitch.",
    price: "$19.99",
    url: "https://www.amazon.com/",
    accent: "#C9A227",
  },
  {
    cover: "",
    title: "Book Title #2",
    description: "A second blueprint for your evolution. Swap this with the real title, price, cover image, and Amazon link.",
    price: "$24.99",
    url: "https://www.amazon.com/",
    accent: "#a855f7",
  },
  {
    cover: "",
    title: "Book Title #3",
    description: "Third volume description. Update BOOKS at the top of components/NaviLibraryPanel.tsx to change anything.",
    price: "$14.99",
    url: "https://www.amazon.com/",
    accent: "#00d4ff",
  },
];

export default function NaviLibraryPanel({ onClose }: { onClose: () => void }) {
  // Fade-in animation trigger
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,162,39,0.10) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(201,162,39,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#C9A227", marginBottom: 3 }}>NAVI</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>📚 Library</div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30, height: 30, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent", color: "#64748b",
            cursor: "pointer", fontSize: 13,
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "28px 16px 40px",
        display: "flex", flexDirection: "column", gap: 24,
        position: "relative",
      }}>

        {/* ── Cinematic intro ─────────────────────────────────────────── */}
        <div style={{
          textAlign: "center",
          padding: "28px 18px",
          borderRadius: 18,
          background: "linear-gradient(160deg, rgba(16,16,26,0.98) 0%, rgba(10,10,20,0.98) 100%)",
          border: "1px solid rgba(201,162,39,0.18)",
          boxShadow: "0 0 48px rgba(201,162,39,0.08), 0 12px 40px rgba(0,0,0,0.5)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 700ms ease, transform 700ms ease",
        }}>
          <div style={{ fontSize: 44, marginBottom: 10, filter: "drop-shadow(0 0 16px rgba(201,162,39,0.45))" }}>📖</div>
          <div style={{
            fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase",
            color: "#C9A227", marginBottom: 12,
          }}>
            The Founder{"'"}s Collection
          </div>
          <div style={{
            fontSize: 15, fontWeight: 700, color: "#f1f5f9",
            lineHeight: 1.7, marginBottom: 8,
            textShadow: "0 0 20px rgba(201,162,39,0.18)",
          }}>
            Every level of growth starts with knowledge.
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: "#e2e8f0",
            lineHeight: 1.7, marginBottom: 8,
          }}>
            These aren{"'"}t just books… these are blueprints.
          </div>
          <div style={{
            fontSize: 12, color: "#94a3b8",
            lineHeight: 1.7, fontStyle: "italic",
          }}>
            Choose what speaks to you… and start your evolution.
          </div>
        </div>

        {/* ── Book grid ─────────────────────────────────────────────── */}
        {BOOKS.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            fontSize: 11, color: "#64748b",
          }}>
            Books coming soon.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {BOOKS.map((book, i) => {
              const accent = book.accent || "#C9A227";
              return (
                <article
                  key={`${book.title}-${i}`}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "linear-gradient(160deg, rgba(18,18,28,0.98) 0%, rgba(10,10,18,0.98) 100%)",
                    border: `1px solid ${accent}22`,
                    boxShadow: `0 0 32px ${accent}0d, 0 10px 30px rgba(0,0,0,0.5)`,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                    transition: `opacity 600ms ease ${180 + i * 120}ms, transform 600ms ease ${180 + i * 120}ms`,
                  }}
                >
                  {/* Cover */}
                  <div style={{
                    position: "relative",
                    width: "100%", aspectRatio: "3 / 2",
                    background: book.cover
                      ? `#000 url(${book.cover}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${accent}28 0%, rgba(10,10,20,0.9) 100%)`,
                    borderBottom: `1px solid ${accent}1a`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {/* Vignette */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(180deg, transparent 55%, rgba(4,4,12,0.85) 100%)",
                      pointerEvents: "none",
                    }} />
                    {!book.cover && (
                      <div style={{
                        fontSize: 48, opacity: 0.55,
                        filter: `drop-shadow(0 0 24px ${accent}55)`,
                      }}>
                        📘
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{
                        fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase",
                        color: accent, marginBottom: 4,
                      }}>
                        Volume {String(i + 1).padStart(2, "0")}
                      </div>
                      <div style={{
                        fontSize: 15, fontWeight: 700, color: "#f1f5f9",
                        lineHeight: 1.35,
                      }}>
                        {book.title}
                      </div>
                    </div>

                    <div style={{
                      fontSize: 11, color: "#94a3b8",
                      lineHeight: 1.65,
                    }}>
                      {book.description}
                    </div>

                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, marginTop: 4,
                    }}>
                      <div style={{
                        fontSize: 14, fontWeight: 800, color: "#f1f5f9",
                        letterSpacing: "0.02em",
                      }}>
                        {book.price}
                      </div>
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "10px 16px", borderRadius: 10,
                          background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                          border: "none",
                          color: "#08080f", fontSize: 11, fontFamily: "monospace",
                          fontWeight: 700, letterSpacing: "0.06em",
                          textDecoration: "none", cursor: "pointer",
                          boxShadow: `0 0 18px ${accent}40`,
                          transition: "transform 150ms ease, box-shadow 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                          (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 24px ${accent}66`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 18px ${accent}40`;
                        }}
                      >
                        View Book
                        <span style={{ fontSize: 12, opacity: 0.75 }}>↗</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div style={{
          textAlign: "center", fontSize: 9, color: "#475569",
          letterSpacing: "0.06em", padding: "8px 0",
        }}>
          More volumes coming. Stay tuned.
        </div>
      </div>
    </div>
  );
}
