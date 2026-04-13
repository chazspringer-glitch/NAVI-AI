"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Pet from "./Pet";
import BondDisplay from "./BondDisplay";
import WorldMap from "./WorldMap";

// ── Layout constants (same as Room) ──────────────────────────────────────────
const PAD_X = 100;
const PAD_Y_TOP = 115;
const PAD_Y_BOT = 148; // extra for bottom nav bar
const FLOOR_Y_MIN = 0.45;
const FLOOR_Y_MAX = 0.72;

// ── World-view pet scale ──────────────────────────────────────────────────────
// NAVI renders at full size in Pet.tsx (body ~127–204px by evolution stage).
// In the world we want it to feel like a small character in a space (~64–96px body).
// CSS scale(0.5) halves the visual size while keeping the origin centered.
// Stage 0 body: 127*0.5 ≈ 64px  |  Stage 3 body: 176*0.5 = 88px  |  Stage 5 body: 204*0.5 = 102px
const WORLD_PET_SCALE = 0.5;
// Ratio matching the grass tile's top edge (top: "47%") — NAVI's feet are anchored here
const GROUND_Y_RATIO = 0.47;
// Pixel-art ground tile (Cute Fantasy RPG pack, served from /public/assets/tiles/)
const GRASS_TILE = "/assets/tiles/Grass_1_Middle.svg";
const WALK_SPEED = 190;

// ── Thought pools (area × time-of-day) ───────────────────────────────────────
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

const THOUGHTS = {
  home: {
    morning:   ["Good morning… what should we do today? ☀️", "Still a little sleepy… 💤", "I dreamed about stars last night…", "Morning already? Time flies!"],
    afternoon: ["Home is the best place to relax…", "I wonder what's for lunch 🍜", "Maybe I should tidy up a bit?", "Such a peaceful afternoon…"],
    evening:   ["Today went by so fast…", "Getting cozy for the evening ✨", "I love this quiet time of day.", "Almost time to wind down…"],
    night:     ["Getting a bit sleepy… 💤", "The stars are beautiful tonight.", "Maybe just a little longer before bed…", "Everything's so still at night…"],
  },
  school: {
    morning:   ["Ready to learn something amazing! 📚", "What shall we study first today?", "My brain feels fresh and sharp!", "Let's make today count!"],
    afternoon: ["I wonder what we should learn today…", "Math or science? Hmm… 🤔", "Learning is my favourite thing!", "So many topics, so little time…"],
    evening:   ["Time to review what we learned!", "Almost done for the day 📝", "That was a great lesson today.", "My head is full of new ideas!"],
    night:     ["Should we squeeze in one more topic?", "Knowledge never sleeps… well, I do 😅", "Sweet dreams are made of learning 💡", "One more page…"],
  },
  playground: {
    morning:   ["Race you to the slide! 🎉", "Let's play something fun today!", "The playground is all ours! ✨", "So much energy this morning!"],
    afternoon: ["Want to play something? 🎮", "I could do this all day!", "Tag — you're it! ...Oh wait.", "Best. Day. Ever."],
    evening:   ["Just five more minutes of play!", "This is the best part of the day 🌅", "Running around makes me so happy!", "The sky looks amazing right now…"],
    night:     ["One last game before bed?", "Stars are out — let's play under them 🌟", "I never want the fun to stop!", "Nighttime adventures are the best."],
  },
};

function pickThought(areaId) {
  const tod = getTimeOfDay();
  const pool = THOUGHTS[areaId]?.[tod] ?? THOUGHTS.home.afternoon;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Time-of-day config ────────────────────────────────────────────────────────
const TIME_CONFIG = {
  morning: {
    overlay:       "rgba(255,200,80,0.06)",   // warm golden wash
    starAlpha:     0.25,                       // faint – sun is up
    walkDelayMin:  2200,                       // energetic – shorter pauses
    walkDelayRange:3500,
    label:         "☀️ Morning",
  },
  afternoon: {
    overlay:       "transparent",
    starAlpha:     0.18,
    walkDelayMin:  3000,
    walkDelayRange:4500,
    label:         "🌤 Afternoon",
  },
  evening: {
    overlay:       "rgba(255,110,40,0.08)",   // amber sunset tint
    starAlpha:     0.55,
    walkDelayMin:  3800,
    walkDelayRange:5000,
    label:         "🌅 Evening",
  },
  night: {
    overlay:       "rgba(5,8,35,0.42)",       // deep indigo darkness
    starAlpha:     1.0,                        // stars at full brightness
    walkDelayMin:  8000,                       // sleepy – long pauses
    walkDelayRange:9000,
    label:         "🌙 Night",
  },
};

// ── Area definitions ──────────────────────────────────────────────────────────
const AREAS = [
  {
    id: "home",
    label: "Home",
    emoji: "🏠",
    modeHint: "🤝 companion",
    bg: "radial-gradient(ellipse at 35% 30%, #2d1848 0%, #180f2e 45%, #0c0818 100%)",
    groundGlow: "rgba(192,132,252,0.07)",
    accent: "#c084fc",
    hint: "Home sweet home… try Companion mode to chat 🤝",
  },
  {
    id: "school",
    label: "School",
    emoji: "📚",
    modeHint: "✊ history",
    bg: "radial-gradient(ellipse at 50% 20%, #0b2848 0%, #071a30 50%, #030d1c 100%)",
    groundGlow: "rgba(0,212,255,0.08)",
    accent: "#00d4ff",
    hint: "Ready to learn? Try Black History mode here ✊",
  },
  {
    id: "playground",
    label: "Playground",
    emoji: "🎮",
    modeHint: "💼 jobs",
    bg: "radial-gradient(ellipse at 60% 50%, #0b2e18 0%, #071c0d 50%, #030e06 100%)",
    groundGlow: "rgba(74,222,128,0.08)",
    accent: "#4ade80",
    hint: "Let's hustle! Job Finder mode is great here 💼",
  },
];

const MODES = [
  { id: "chat",     label: "Chat",   icon: "💬" },
  { id: "learning", label: "Learn",  icon: "📚" },
  { id: "mentor",   label: "Mentor", icon: "⭐" },
];

// ── Pixel-art area buildings (Cute Fantasy RPG style) ────────────────────────

function PixelHomeBuilding({ timeOfDay }) {
  const isNight   = timeOfDay === "night";
  const isMorning = timeOfDay === "morning";
  const houseFilter = isNight
    ? "brightness(0.55) saturate(0.75)"
    : isMorning ? "brightness(1.05)" : "brightness(0.97)";
  const treeOpacity = isNight ? 0.45 : 0.95;

  return (
    <>
      {/* Dirt path strip in front of house */}
      <div style={{
        position:"absolute", left:"10%", right:"45%", bottom:"53%",
        height:10,
        background:"linear-gradient(to bottom, #8b5e3c 0%, #6b4422 100%)",
        borderRadius:"2px 2px 0 0",
        pointerEvents:"none", zIndex:1,
      }} />

      {/* Fence — left side */}
      <div style={{ position:"absolute", left:"6%", bottom:"53%", pointerEvents:"none" }}>
        <svg width="28" height="24" viewBox="0 0 28 24" style={{ imageRendering:"pixelated", display:"block" }}>
          {/* Rails */}
          <rect x="0" y="7"  width="28" height="3" fill="#c8a060"/>
          <rect x="0" y="15" width="28" height="3" fill="#c8a060"/>
          {/* Pickets */}
          {[1,7,13,19].map((x,i) => (
            <g key={i}>
              <rect x={x} y="3" width="4" height="18" fill="#dab878"/>
              <polygon points={`${x+2},0 ${x},3 ${x+4},3`} fill="#e8cc88"/>
            </g>
          ))}
        </svg>
      </div>

      {/* Fence — right side of house */}
      <div style={{ position:"absolute", left:"38%", bottom:"53%", pointerEvents:"none" }}>
        <svg width="28" height="24" viewBox="0 0 28 24" style={{ imageRendering:"pixelated", display:"block" }}>
          <rect x="0" y="7"  width="28" height="3" fill="#c8a060"/>
          <rect x="0" y="15" width="28" height="3" fill="#c8a060"/>
          {[1,7,13,19].map((x,i) => (
            <g key={i}>
              <rect x={x} y="3" width="4" height="18" fill="#dab878"/>
              <polygon points={`${x+2},0 ${x},3 ${x+4},3`} fill="#e8cc88"/>
            </g>
          ))}
        </svg>
      </div>

      {/* Tree — left of lamp */}
      <div style={{ position:"absolute", left:"1%", bottom:"53%", pointerEvents:"none",
        opacity:treeOpacity, transition:"opacity 2.5s ease" }}>
        <svg width="34" height="54" viewBox="0 0 34 54" style={{ imageRendering:"pixelated", display:"block" }}>
          <ellipse cx="17" cy="20" rx="15" ry="13" fill="#2a6018"/>
          <ellipse cx="17" cy="12" rx="11" ry="10" fill="#388820"/>
          <ellipse cx="17" cy="6"  rx="8"  ry="7"  fill="#46aa26"/>
          <rect x="14" y="30" width="6" height="24" fill="#5a3a18"/>
          <rect x="12" y="50" width="10" height="4" fill="#4a2e14"/>
        </svg>
      </div>

      {/* Street lamp */}
      <div style={{ position:"absolute", left:"5%", bottom:"53%", pointerEvents:"none" }}>
        <svg width="18" height="48" viewBox="0 0 18 48" style={{ imageRendering:"pixelated", display:"block" }}>
          <rect x="8" y="14" width="3" height="34" fill="#6a6a6a"/>
          <rect x="4" y="6" width="11" height="8" fill="#4a4a4a" rx="2"/>
          <rect x="5" y="8" width="9" height="5"
            fill={isNight ? "rgba(255,230,100,0.95)" : "rgba(200,200,180,0.4)"} rx="1"/>
          <rect x="8" y="10" width="9" height="3" fill="#5a5a5a"/>
          <rect x="6" y="44" width="7" height="4" fill="#4a4a4a" rx="1"/>
        </svg>
        {isNight && (
          <div style={{ position:"absolute", top:6, right:1, width:12, height:12, borderRadius:"50%",
            background:"rgba(255,220,100,0.9)",
            boxShadow:"0 0 18px rgba(255,200,60,0.9), 0 0 40px rgba(255,160,20,0.5)",
            pointerEvents:"none" }} />
        )}
      </div>

      {/* House — SVG from /public/assets/tiles/ */}
      <div style={{ position:"absolute", left:"10%", bottom:"53%", pointerEvents:"none" }}>
        <img
          src="/assets/tiles/House_1_Stone_Base_Black.svg"
          alt="NAVI's House"
          style={{
            width: 160,
            display: "block",
            imageRendering: "pixelated",
            filter: houseFilter,
            transition: "filter 2.5s ease",
          }}
        />
        {/* Warm window glow at night */}
        {isNight && (
          <div style={{
            position:"absolute", bottom:"18%", left:"18%",
            width:"26%", height:"14%",
            background:"rgba(255,190,60,0.15)",
            boxShadow:"0 0 20px rgba(255,165,30,0.55), 0 0 40px rgba(255,140,15,0.3)",
            borderRadius:2, pointerEvents:"none",
          }} />
        )}
      </div>

      {/* Tree — right of house */}
      <div style={{ position:"absolute", left:"40%", bottom:"53%", pointerEvents:"none",
        opacity:treeOpacity, transition:"opacity 2.5s ease" }}>
        <svg width="36" height="56" viewBox="0 0 36 56" style={{ imageRendering:"pixelated", display:"block" }}>
          <ellipse cx="18" cy="20" rx="16" ry="13" fill="#2a6018"/>
          <ellipse cx="18" cy="12" rx="12" ry="10" fill="#388820"/>
          <ellipse cx="18" cy="6"  rx="9"  ry="8"  fill="#48aa28"/>
          <rect x="15" y="30" width="6" height="26" fill="#5a3a18"/>
          <rect x="13" y="52" width="10" height="4" fill="#4a2e14"/>
        </svg>
      </div>

      {/* Small bush / flowers */}
      <div style={{ position:"absolute", left:"47%", bottom:"53%", pointerEvents:"none",
        opacity: isNight ? 0.55 : 1, transition:"opacity 2.5s ease" }}>
        <svg width="32" height="20" viewBox="0 0 32 20" style={{ imageRendering:"pixelated", display:"block" }}>
          <ellipse cx="8"  cy="13" rx="7"  ry="6" fill="#2e6818"/>
          <ellipse cx="16" cy="9"  rx="9"  ry="8" fill="#3e8822"/>
          <ellipse cx="25" cy="13" rx="7"  ry="6" fill="#2e6818"/>
          <rect x="5" y="15" width="22" height="5" fill="#5a3a18"/>
          <rect x="12" y="3" width="4" height="4" fill="#f472b6" rx="1"/>
          <rect x="19" y="2" width="4" height="4" fill="#fb923c" rx="1"/>
          <rect x="6"  y="7" width="3" height="3" fill="#facc15" rx="1"/>
        </svg>
      </div>

      {/* Moon crescent / morning sun glimmer in sky */}
      <div style={{ position:"absolute", top:"9%", right:"18%", width:18, height:18,
        borderRadius:"50%",
        border: isMorning ? "2px solid rgba(253,224,71,0.9)" : "2px solid rgba(240,220,140,0.5)",
        boxShadow: isMorning ? "0 0 16px rgba(253,224,71,0.7)" : "0 0 8px rgba(240,220,140,0.3)",
        clipPath: isMorning ? "none" : "inset(0 30% 0 0)",
        pointerEvents:"none", transition:"all 2s ease" }} />
    </>
  );
}

function PixelSchoolBuilding({ timeOfDay }) {
  const isNight = timeOfDay === "night";
  const dim     = isNight ? 0.5 : 1;
  const winFill = isNight ? "#ffe8a0" : "#8fd4f8";

  return (
    <>
      {/* School zone ground tint — blue-ish semi-transparent overlay on grass */}
      <div style={{
        position:"absolute", left:"2%", right:"2%", bottom:"53%",
        height:20,
        background:"rgba(0,180,255,0.08)",
        borderRadius:"4px 4px 0 0",
        border:"1px solid rgba(0,180,255,0.14)",
        borderBottom:"none",
        pointerEvents:"none", zIndex:1,
      }} />

      {/* Floating desk+book zone label */}
      <div style={{
        position:"absolute", left:"50%", bottom:"56%",
        transform:"translateX(-50%)",
        pointerEvents:"none", zIndex:5,
        opacity: isNight ? 0.45 : 0.7,
        transition:"opacity 2.5s ease",
      }}>
        <div style={{
          display:"flex", alignItems:"center", gap:4,
          background:"rgba(0,18,48,0.72)",
          border:"1px solid rgba(0,180,255,0.25)",
          borderRadius:6, padding:"2px 7px",
          fontFamily:"monospace", fontSize:9,
          color:"rgba(0,220,255,0.9)",
          letterSpacing:"0.06em",
          whiteSpace:"nowrap",
        }}>
          📚 Learning Zone
        </div>
      </div>

      {/* Flag pole */}
      <div style={{ position:"absolute", left:"3%", bottom:"53%", pointerEvents:"none",
        opacity:dim, transition:"opacity 2.5s ease" }}>
        <svg width="20" height="60" viewBox="0 0 20 60" style={{ imageRendering:"pixelated", display:"block" }}>
          <rect x="9" y="0" width="2" height="60" fill="#aaaaaa"/>
          <rect x="11" y="2" width="8" height="7"  fill="#cc2222"/>
          <rect x="11" y="9" width="8" height="5"  fill="#eeeeee"/>
          <rect x="8"  y="0" width="4" height="2"  fill="#ddcc22"/>
        </svg>
      </div>

      {/* Brick school building */}
      <div style={{ position:"absolute", left:"6%", bottom:"53%", pointerEvents:"none",
        opacity:dim, transition:"opacity 2.5s ease" }}>
        <svg width="104" height="100" viewBox="0 0 104 100" style={{ imageRendering:"pixelated", display:"block" }}>
          {/* Roof */}
          <polygon points="52,2 6,28 98,28" fill="#3a3a4a"/>
          <rect x="4" y="26" width="96" height="5" fill="#22222e"/>
          {/* Walls */}
          <rect x="4" y="31" width="96" height="57" fill="#7a3232"/>
          {/* Brick rows */}
          <rect x="6"  y="33" width="22" height="6" fill="#984040" rx="0.5"/>
          <rect x="30" y="33" width="26" height="6" fill="#8a3838" rx="0.5"/>
          <rect x="58" y="33" width="22" height="6" fill="#984040" rx="0.5"/>
          <rect x="82" y="33" width="14" height="6" fill="#8a3838" rx="0.5"/>
          <rect x="6"  y="41" width="14" height="6" fill="#8a3838" rx="0.5"/>
          <rect x="22" y="41" width="28" height="6" fill="#984040" rx="0.5"/>
          <rect x="52" y="41" width="20" height="6" fill="#8a3838" rx="0.5"/>
          <rect x="74" y="41" width="22" height="6" fill="#984040" rx="0.5"/>
          <rect x="6"  y="49" width="24" height="6" fill="#984040" rx="0.5"/>
          <rect x="32" y="49" width="20" height="6" fill="#8a3838" rx="0.5"/>
          <rect x="54" y="49" width="24" height="6" fill="#984040" rx="0.5"/>
          <rect x="80" y="49" width="16" height="6" fill="#8a3838" rx="0.5"/>
          <rect x="6"  y="57" width="18" height="6" fill="#8a3838" rx="0.5"/>
          <rect x="26" y="57" width="26" height="6" fill="#984040" rx="0.5"/>
          <rect x="54" y="57" width="18" height="6" fill="#8a3838" rx="0.5"/>
          <rect x="74" y="57" width="22" height="6" fill="#984040" rx="0.5"/>
          {/* Left window */}
          <rect x="8"  y="35" width="16" height="16" fill="#111"/>
          <rect x="9"  y="36" width="14" height="14" fill={winFill}/>
          <rect x="15" y="36" width="2"  height="14" fill="#111"/>
          <rect x="9"  y="42" width="14" height="2"  fill="#111"/>
          {/* Right window */}
          <rect x="80" y="35" width="16" height="16" fill="#111"/>
          <rect x="81" y="36" width="14" height="14" fill={winFill}/>
          <rect x="87" y="36" width="2"  height="14" fill="#111"/>
          <rect x="81" y="42" width="14" height="2"  fill="#111"/>
          {/* Door */}
          <rect x="40" y="61" width="24" height="27" fill="#111"/>
          <rect x="41" y="62" width="22" height="25" fill="#4a2810"/>
          <rect x="43" y="64" width="8"  height="11" fill="#3a2008"/>
          <rect x="53" y="64" width="8"  height="11" fill="#3a2008"/>
          <rect x="43" y="77" width="18" height="10" fill="#3a2008"/>
          <rect x="57" y="74" width="4"  height="4"  fill="#c8a040" rx="1"/>
          {/* Black foundation */}
          <rect x="0"  y="86" width="104" height="14" fill="#111"/>
          <rect x="4"  y="88" width="28"  height="8"  fill="#1a1a1a" rx="0.5"/>
          <rect x="34" y="88" width="32"  height="8"  fill="#222"    rx="0.5"/>
          <rect x="68" y="88" width="30"  height="8"  fill="#1a1a1a" rx="0.5"/>
          {/* School sign on roof */}
          <rect x="32" y="26" width="40" height="9"  fill="#c8a030" rx="1"/>
          <rect x="34" y="28" width="36" height="5"  fill="#e8c050" rx="0.5"/>
          {[38,44,50,56,62].map((x,i) => (
            <rect key={i} x={x} y="30" width="4" height="2" fill="#8a6010" rx="0.5"/>
          ))}
        </svg>
      </div>

      {/* Tree (right side) */}
      <div style={{ position:"absolute", right:"5%", bottom:"53%", pointerEvents:"none",
        opacity: isNight ? 0.4 : 0.9, transition:"opacity 2.5s ease" }}>
        <svg width="38" height="58" viewBox="0 0 38 58" style={{ imageRendering:"pixelated", display:"block" }}>
          <ellipse cx="19" cy="20" rx="17" ry="14" fill="#2a6a18"/>
          <ellipse cx="19" cy="13" rx="13" ry="11" fill="#3a8822"/>
          <ellipse cx="19" cy="7"  rx="9"  ry="8"  fill="#4aaa2a"/>
          <rect x="16" y="30" width="6" height="28" fill="#5a3a18"/>
          <rect x="14" y="52" width="10" height="6" fill="#4a2e14"/>
        </svg>
      </div>
    </>
  );
}

function PixelPlaygroundBuilding({ timeOfDay }) {
  const isNight   = timeOfDay === "night";
  const isMorning = timeOfDay === "morning";
  const dim       = isNight ? 0.45 : 1;
  const cloudAlpha = isNight ? 0.12 : 0.13;

  return (
    <>
      {/* Circular play zone marker on ground */}
      <div style={{
        position:"absolute",
        left:"50%", bottom:"53%",
        transform:"translateX(-50%)",
        width:180, height:18,
        background:"rgba(74,222,128,0.1)",
        border:"2px solid rgba(74,222,128,0.25)",
        borderRadius:"50%",
        pointerEvents:"none", zIndex:1,
        opacity: isNight ? 0.35 : 0.85,
        transition:"opacity 2.5s ease",
      }} />

      {/* Clouds */}
      {[{l:"12%",t:"7%"},{l:"48%",t:"5%"},{l:"70%",t:"9%"}].map((c,i) => (
        <div key={i} style={{ position:"absolute", left:c.l, top:c.t, pointerEvents:"none" }}>
          <div style={{ position:"relative", width:44, height:20 }}>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:12,
              background: isNight ? `rgba(160,180,255,${cloudAlpha})` : `rgba(200,225,255,${cloudAlpha})`,
              borderRadius:7, transition:"background 2.5s ease" }} />
            <div style={{ position:"absolute", bottom:7, left:6,  width:17, height:17,
              background: isNight ? "rgba(160,180,255,0.07)" : "rgba(200,225,255,0.09)", borderRadius:"50%" }} />
            <div style={{ position:"absolute", bottom:7, left:18, width:14, height:14,
              background: isNight ? "rgba(160,180,255,0.07)" : "rgba(200,225,255,0.09)", borderRadius:"50%" }} />
          </div>
        </div>
      ))}

      {/* Tree — left side */}
      <div style={{ position:"absolute", left:"2%", bottom:"53%", pointerEvents:"none",
        opacity: isNight ? 0.4 : 0.9, transition:"opacity 2.5s ease" }}>
        <svg width="36" height="56" viewBox="0 0 36 56" style={{ imageRendering:"pixelated", display:"block" }}>
          <ellipse cx="18" cy="20" rx="16" ry="13" fill="#2a6818"/>
          <ellipse cx="18" cy="13" rx="12" ry="10" fill="#3a8822"/>
          <ellipse cx="18" cy="7"  rx="8"  ry="7"  fill="#4aaa2a"/>
          <rect x="15" y="30" width="6" height="26" fill="#5a3a18"/>
          <rect x="13" y="50" width="10" height="6" fill="#4a2e14"/>
        </svg>
      </div>

      {/* Swing set */}
      <div style={{ position:"absolute", left:"5%", bottom:"53%", pointerEvents:"none",
        opacity:dim, transition:"opacity 2.5s ease" }}>
        <svg width="86" height="76" viewBox="0 0 86 76" style={{ imageRendering:"pixelated", display:"block" }}>
          {/* A-frame left */}
          <line x1="5"  y1="64" x2="22" y2="8"  stroke="#7a5020" strokeWidth="5" strokeLinecap="square"/>
          <line x1="39" y1="64" x2="22" y2="8"  stroke="#7a5020" strokeWidth="5" strokeLinecap="square"/>
          {/* A-frame right */}
          <line x1="47" y1="64" x2="64" y2="8"  stroke="#7a5020" strokeWidth="5" strokeLinecap="square"/>
          <line x1="81" y1="64" x2="64" y2="8"  stroke="#7a5020" strokeWidth="5" strokeLinecap="square"/>
          {/* Top cross-bar */}
          <rect x="18" y="5" width="50" height="7" fill="#9a6828" rx="2"/>
          {/* Chain ropes */}
          <line x1="28" y1="12" x2="24" y2="50" stroke="#777" strokeWidth="2"/>
          <line x1="36" y1="12" x2="40" y2="50" stroke="#777" strokeWidth="2"/>
          <line x1="50" y1="12" x2="46" y2="50" stroke="#777" strokeWidth="2"/>
          <line x1="58" y1="12" x2="62" y2="50" stroke="#777" strokeWidth="2"/>
          {/* Seats */}
          <rect x="20" y="49" width="22" height="5" fill="#4a2810" rx="2"/>
          <rect x="42" y="49" width="22" height="5" fill="#4a2810" rx="2"/>
          {/* Shadow */}
          <ellipse cx="43" cy="69" rx="38" ry="5" fill="rgba(0,0,0,0.18)"/>
        </svg>
      </div>

      {/* Slide tower */}
      <div style={{ position:"absolute", right:"6%", bottom:"53%", pointerEvents:"none",
        opacity:dim, transition:"opacity 2.5s ease" }}>
        <svg width="78" height="84" viewBox="0 0 78 84" style={{ imageRendering:"pixelated", display:"block" }}>
          {/* Tower posts */}
          <rect x="4"  y="24" width="8" height="60" fill="#7a5020" rx="2"/>
          <rect x="40" y="24" width="8" height="60" fill="#7a5020" rx="2"/>
          {/* Platform */}
          <rect x="2"  y="18" width="48" height="8" fill="#a07830" rx="2"/>
          {/* Railing */}
          <rect x="2"  y="10" width="5" height="10" fill="#8a6828"/>
          <rect x="44" y="10" width="5" height="10" fill="#8a6828"/>
          <rect x="2"  y="8"  width="46" height="4" fill="#c09040" rx="1"/>
          {/* Ladder rungs */}
          {[36,44,52,60,68].map((y,i) => (
            <rect key={i} x="4" y={y} width="8" height="4" fill="#c09040" rx="1"/>
          ))}
          {/* Slide body */}
          <line x1="50" y1="22" x2="76" y2="76" stroke="#6888a0" strokeWidth="9" strokeLinecap="round"/>
          {/* Slide highlight */}
          <line x1="49" y1="20" x2="75" y2="74" stroke="#90b8d0" strokeWidth="3" strokeLinecap="round"/>
          {/* Slide rails */}
          <line x1="46" y1="23" x2="72" y2="77" stroke="#4a6878" strokeWidth="2"/>
          <line x1="54" y1="21" x2="80" y2="75" stroke="#4a6878" strokeWidth="2"/>
          {/* Shadow */}
          <ellipse cx="38" cy="82" rx="35" ry="4" fill="rgba(0,0,0,0.18)"/>
        </svg>
      </div>

      {/* Bench (centre) */}
      <div style={{ position:"absolute", left:"38%", bottom:"53%", pointerEvents:"none",
        opacity:dim, transition:"opacity 2.5s ease" }}>
        <svg width="48" height="26" viewBox="0 0 48 26" style={{ imageRendering:"pixelated", display:"block" }}>
          <rect x="2"  y="10" width="44" height="6" fill="#a07830" rx="2"/>
          <rect x="2"  y="2"  width="44" height="5" fill="#c09040" rx="2"/>
          <rect x="4"  y="2"  width="4" height="16" fill="#7a5020"/>
          <rect x="40" y="2"  width="4" height="16" fill="#7a5020"/>
          <rect x="6"  y="16" width="4" height="10" fill="#7a5020"/>
          <rect x="38" y="16" width="4" height="10" fill="#7a5020"/>
        </svg>
      </div>

      {/* Sun / moon in sky */}
      <div style={{ position:"absolute", top:"8%", right:"16%", width:18, height:18,
        borderRadius:"50%",
        background: isMorning ? "rgba(253,224,71,0.7)" : "transparent",
        border: isMorning ? "none" : "2px solid rgba(220,220,255,0.4)",
        boxShadow: isMorning ? "0 0 18px rgba(253,224,71,0.65)" : "0 0 8px rgba(200,210,255,0.3)",
        clipPath: (!isMorning && !isNight) ? "none" : undefined,
        pointerEvents:"none", transition:"all 2s ease" }} />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function World({ mood, isSpeaking, petName, bondXP, evolutionStage, mentorMode, onModeChange, onAreaChange }) {
  const roomRef = useRef(null);
  const [roomW, setRoomW] = useState(375);
  const [roomH, setRoomH] = useState(300);

  const [petX, setPetX] = useState(187);
  const [petY, setPetY] = useState(200);
  const [isWalking, setIsWalking] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isJumping, setIsJumping] = useState(false);
  const [walkDuration, setWalkDuration] = useState(1.5);
  const [clickMarker, setClickMarker] = useState(null);

  const [areaIdx, setAreaIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState("");
  const [showThought, setShowThought] = useState(false);
  const [currentThought, setCurrentThought] = useState("");
  const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay());

  const petXRef = useRef(187);
  const petYRef = useRef(200);
  const walkEndRef = useRef(null);
  const walkScheduleRef = useRef(null);
  const roomWRef = useRef(375);
  const roomHRef = useRef(300);
  const hintTimerRef = useRef(null);
  const thoughtTimerRef = useRef(null);
  const thoughtHideRef = useRef(null);
  const areaIdxRef = useRef(0);
  const timeOfDayRef = useRef(getTimeOfDay());

  const area = AREAS[areaIdx];

  // ── Track room size ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = roomRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setRoomW(width); setRoomH(height);
      roomWRef.current = width; roomHRef.current = height;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (roomW > 200 && petXRef.current === 187) {
      const x = roomW / 2, y = Math.round(roomH * GROUND_Y_RATIO);
      setPetX(x); setPetY(y);
      petXRef.current = x; petYRef.current = y;
    }
  }, [roomW, roomH]);

  // ── Move function ─────────────────────────────────────────────────────────
  const movePetTo = useCallback((rawX, rawY) => { // rawY accepted but Y is always ground
    const w = roomWRef.current, h = roomHRef.current;
    const x = Math.max(PAD_X, Math.min(w - PAD_X, rawX));
    const y = Math.round(h * GROUND_Y_RATIO);
    const dx = x - petXRef.current, dy = y - petYRef.current;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 12) return;
    const dur = Math.max(0.4, Math.min(2.8, dist / WALK_SPEED));
    setFacingRight(dx >= 0);
    setWalkDuration(dur);
    setIsWalking(true);
    setPetX(x); setPetY(y);
    petXRef.current = x; petYRef.current = y;
    if (walkEndRef.current) clearTimeout(walkEndRef.current);
    walkEndRef.current = setTimeout(() => setIsWalking(false), dur * 1000 + 80);
  }, []);

  // ── Random walk ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (roomW < 150) return;
    const schedule = () => {
      const delay = TIME_CONFIG[timeOfDayRef.current].walkDelayMin + Math.random() * TIME_CONFIG[timeOfDayRef.current].walkDelayRange;
      walkScheduleRef.current = setTimeout(() => {
        if (Math.random() > 0.38) {
          const w = roomWRef.current, h = roomHRef.current;
          const x = PAD_X + Math.random() * (w - PAD_X * 2);
          movePetTo(x);
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (walkScheduleRef.current) clearTimeout(walkScheduleRef.current); };
  }, [roomW, movePetTo]);

  // ── Jump on reply ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSpeaking) return;
    if (walkEndRef.current) clearTimeout(walkEndRef.current);
    setIsWalking(false); setIsJumping(true);
    const t = setTimeout(() => setIsJumping(false), 700);
    return () => clearTimeout(t);
  }, [isSpeaking]);

  // Keep refs in sync
  useEffect(() => { areaIdxRef.current = areaIdx; }, [areaIdx]);
  useEffect(() => { timeOfDayRef.current = timeOfDay; }, [timeOfDay]);

  // ── Live clock — update time-of-day every 60 s ────────────────────────────
  useEffect(() => {
    const tick = () => {
      const t = getTimeOfDay();
      setTimeOfDay(t);
      timeOfDayRef.current = t;
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Spontaneous thoughts every 30–60 s ────────────────────────────────────
  useEffect(() => {
    const schedule = () => {
      const delay = 30_000 + Math.random() * 30_000;
      thoughtTimerRef.current = setTimeout(() => {
        // Don't show while NAVI is speaking (chat reply in progress)
        if (!isSpeaking) {
          const thought = pickThought(AREAS[areaIdxRef.current].id);
          setCurrentThought(thought);
          setShowThought(true);
          if (thoughtHideRef.current) clearTimeout(thoughtHideRef.current);
          thoughtHideRef.current = setTimeout(() => setShowThought(false), 4500);
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      clearTimeout(thoughtTimerRef.current);
      clearTimeout(thoughtHideRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Click to move ─────────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    if (e.target.closest("[data-noclick]")) return;
    const rect = roomRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    setClickMarker({ x, y, id: Date.now() });
    setTimeout(() => setClickMarker(null), 650);
    movePetTo(x, y);
  }, [movePetTo]);

  // ── Area switching ────────────────────────────────────────────────────────
  const switchArea = useCallback((idx) => {
    if (idx === areaIdx || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setAreaIdx(idx);
      areaIdxRef.current = idx;
      const cx = roomWRef.current / 2, cy = Math.round(roomHRef.current * GROUND_Y_RATIO);
      setPetX(cx); setPetY(cy);
      petXRef.current = cx; petYRef.current = cy;
      setShowThought(false);
      setHintText(AREAS[idx].hint);
      setShowHint(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setShowHint(false), 3200);
      setTransitioning(false);
      if (onAreaChange) onAreaChange(idx);
    }, 280);
  }, [areaIdx, transitioning, onAreaChange]);

  // groundY = the pixel Y of the grass top edge — NAVI's feet are always here
  const groundY = Math.round(roomH * GROUND_Y_RATIO);
  // Fixed shadow opacity (no longer varies with Y since NAVI walks at one ground level)
  const shadowOpacity = 0.38;

  return (
    <WorldMap ref={roomRef} bg={area.bg} onClick={handleClick}>
      {/* Transition flash */}
      {transitioning && (
        <div style={{ position:"absolute", inset:0, background:"#000", opacity:0.4, zIndex:50, pointerEvents:"none", animation:"areaFlash 0.28s ease-in-out forwards" }} />
      )}

      {/* Star field — brightness varies with time of day */}
      {STARS.map((s) => (
        <div key={s.id} style={{ position:"absolute", left:s.x, top:s.y, width:s.r, height:s.r, borderRadius:"50%", background:`rgba(200,220,255,${TIME_CONFIG[timeOfDay].starAlpha})`, pointerEvents:"none", transition:"background 3s ease" }} />
      ))}

      {/* Time-of-day tint overlay */}
      {TIME_CONFIG[timeOfDay].overlay !== "transparent" && (
        <div style={{ position:"absolute", inset:0, background:TIME_CONFIG[timeOfDay].overlay, pointerEvents:"none", zIndex:1, transition:"background 3s ease", pointerEvents:"none" }} />
      )}

      {/* ── Pixel-art grass ground (Grass_1_Middle.png, 3× scale) ── */}
      <div style={{
        position:"absolute", top:"47%", left:0, right:0, bottom:52,
        backgroundImage:`url(${GRASS_TILE})`,
        backgroundSize:"64px 64px",
        backgroundRepeat:"repeat",
        imageRendering:"pixelated",
        pointerEvents:"none",
        zIndex:2,
      }} />
      {/* Thin horizon shadow where sky meets grass */}
      <div style={{ position:"absolute", top:"47%", left:0, right:0, height:5,
        background:"rgba(0,0,0,0.32)", pointerEvents:"none", zIndex:2 }} />

      {/* Area-accent ground glow over the grass */}
      <div style={{ position:"absolute", bottom:52, left:0, right:0, height:"18%",
        background:`linear-gradient(to top, ${area.groundGlow} 0%, transparent 100%)`,
        pointerEvents:"none", transition:"background 0.5s ease", zIndex:3 }} />

      {/* Pixel-art area buildings */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:4 }}>
        {areaIdx === 0 && <PixelHomeBuilding   timeOfDay={timeOfDay} />}
        {areaIdx === 1 && <PixelSchoolBuilding  timeOfDay={timeOfDay} />}
        {areaIdx === 2 && <PixelPlaygroundBuilding timeOfDay={timeOfDay} />}
      </div>

      {/* Time-of-day badge */}
      <div style={{ position:"absolute", top:10, right:10, zIndex:32, fontFamily:"monospace", fontSize:10, color:"rgba(200,210,255,0.5)", letterSpacing:"0.08em", pointerEvents:"none", background:"rgba(0,0,0,0.2)", padding:"2px 6px", borderRadius:6 }}>
        {TIME_CONFIG[timeOfDay].label}
      </div>

      {/* Click ripple */}
      {clickMarker && (
        <div key={clickMarker.id} className="absolute pointer-events-none animate-ping" style={{ left:clickMarker.x, top:clickMarker.y, width:22, height:22, transform:"translate(-50%,-50%)", borderRadius:"50%", border:`2px solid ${area.accent}bb` }} />
      )}

      {/* Shadow — sits on the ground directly under NAVI's feet */}
      <div className="absolute pointer-events-none" style={{ left:petX, top:groundY - 3, width:54, height:10, transform:"translate(-50%,-50%)", borderRadius:"50%", background:"radial-gradient(ellipse,rgba(0,0,0,0.48) 0%,transparent 70%)", opacity:shadowOpacity, transition:isWalking?`left ${walkDuration}s cubic-bezier(0.4,0,0.2,1)`:"left 0.25s ease", filter:"blur(4px)", zIndex:19 }} />

      {/* Hint bubble */}
      {showHint && (
        <div className="absolute pointer-events-none" style={{ left:petX, top:groundY - 44, transform:"translate(-50%,-50%)", zIndex:25, transition:isWalking?`left ${walkDuration}s cubic-bezier(0.4,0,0.2,1)`:"left 0.25s ease" }}>
          <div style={{ position:"absolute", bottom:"115%", left:"50%", transform:"translateX(-50%)", whiteSpace:"nowrap", background:"rgba(8,8,15,0.9)", border:`1px solid ${area.accent}55`, borderRadius:10, padding:"5px 10px", fontFamily:"monospace", fontSize:11, color:area.accent, animation:"hintFloat 3.2s ease-in-out forwards", pointerEvents:"none" }}>
            {hintText}
          </div>
        </div>
      )}

      {/* Thought bubble */}
      {showThought && currentThought && (
        <div className="absolute pointer-events-none" style={{ left:petX, top:groundY - 44, transform:"translate(-50%,-50%)", zIndex:26, transition:isWalking?`left ${walkDuration}s cubic-bezier(0.4,0,0.2,1)`:"left 0.25s ease" }}>
          {/* Dot chain rising from NAVI */}
          {[{s:5,b:"102%"},{s:7,b:"118%"},{s:9,b:"137%"}].map((d,i) => (
            <div key={i} style={{ position:"absolute", left:"50%", bottom:d.b, transform:"translateX(-50%)", width:d.s, height:d.s, borderRadius:"50%", background:area.accent, opacity:0.55 }} />
          ))}
          {/* Cloud bubble */}
          <div style={{
            position:"absolute",
            bottom:"155%",
            left:"50%",
            transform:"translateX(-50%)",
            maxWidth:170,
            minWidth:100,
            background:"rgba(8,8,20,0.92)",
            border:`1px solid ${area.accent}66`,
            borderRadius:18,
            padding:"8px 13px",
            fontFamily:"monospace",
            fontSize:11,
            color:"rgba(255,255,255,0.88)",
            lineHeight:1.5,
            textAlign:"center",
            whiteSpace:"normal",
            boxShadow:`0 0 18px ${area.accent}22, inset 0 0 12px rgba(255,255,255,0.02)`,
            animation:"thoughtPop 4.5s ease-in-out forwards",
          }}>
            {/* Thought text */}
            {currentThought}
            {/* Subtle accent dot */}
            <span style={{ display:"block", marginTop:3, fontSize:9, color:area.accent, opacity:0.6 }}>
              {area.emoji} {area.id}
            </span>
          </div>
        </div>
      )}

      {/* Sleepy 💤 floater — night only, when NAVI is idle */}
      {timeOfDay === "night" && !isWalking && !isSpeaking && !showThought && (
        <div className="absolute pointer-events-none" style={{ left:petX, top:groundY - 44, transform:"translate(-50%,-50%)", transition:"left 0.25s ease", zIndex:21 }}>
          <div style={{ position:"absolute", bottom:"108%", left:"62%", fontSize:14, animation:"sleepyFloat 2.6s ease-in-out infinite", opacity:0.75 }}>💤</div>
        </div>
      )}

      {/* NAVI character — bottom edge anchored to grass line via bottom positioning +
           transformOrigin "50% 100%" so scale(0.5) shrinks upward from feet */}
      <div className="absolute pointer-events-none" style={{ left:petX, bottom:roomH - groundY, transform:`translateX(-50%) scale(${WORLD_PET_SCALE})`, transformOrigin:"50% 100%", transition:isWalking?`left ${walkDuration}s cubic-bezier(0.4,0,0.2,1)`:"left 0.25s ease", zIndex:20, willChange:"left" }}>
        <Pet mood={mood} isSpeaking={isSpeaking} petName={petName} isWalking={isWalking} facingRight={facingRight} isJumping={isJumping} evolutionStage={evolutionStage} />
      </div>

      {/* Bond bar */}
      <div data-noclick="true" className="absolute inset-x-0 pointer-events-none" style={{ bottom:52, zIndex:30, background:"linear-gradient(to top,rgba(8,8,15,0.75) 0%,transparent 100%)", padding:"6px 12px 4px" }} onClick={(e) => e.stopPropagation()}>
        <div className="pointer-events-auto max-w-sm mx-auto">
          <BondDisplay bondXP={bondXP} />
        </div>
      </div>

      {/* ── Bottom bar: mode toggle + area tabs ─────────────────────────── */}
      <div data-noclick="true" className="absolute bottom-0 inset-x-0" style={{ zIndex:31, background:"rgba(6,6,14,0.88)", borderTop:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(10px)", display:"flex", alignItems:"stretch", height:52 }} onClick={(e) => e.stopPropagation()}>

        {/* Mode toggle — left */}
        <div className="flex items-center gap-0.5 px-2 flex-shrink-0" style={{ borderRight:"1px solid rgba(255,255,255,0.07)" }}>
          {MODES.map(({ id, icon }) => {
            const active = mentorMode === id;
            return (
              <button key={id} onClick={() => onModeChange(id)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all duration-200"
                style={active ? {
                  background: id==="learning"?"rgba(74,222,128,0.15)":id==="mentor"?"rgba(251,191,36,0.15)":"rgba(0,212,255,0.15)",
                  border: id==="learning"?"1px solid rgba(74,222,128,0.4)":id==="mentor"?"1px solid rgba(251,191,36,0.4)":"1px solid rgba(0,212,255,0.4)",
                } : { border:"1px solid transparent", opacity:0.45 }}
                title={id}
              >{icon}</button>
            );
          })}
        </div>

        {/* Area tabs — right (fills remaining space) */}
        <div className="flex flex-1 items-stretch">
          {AREAS.map((a, i) => {
            const active = i === areaIdx;
            return (
              <button key={a.id} onClick={() => switchArea(i)}
                className="flex-1 flex flex-col items-center justify-center gap-0 transition-all duration-200"
                style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", background: active ? `${a.accent}12` : "transparent", borderBottom: active ? `2px solid ${a.accent}` : "2px solid transparent", paddingTop:4, paddingBottom:4 }}
              >
                <span style={{ fontSize:15 }}>{a.emoji}</span>
                <span style={{ fontFamily:"monospace", fontSize:9, letterSpacing:"0.12em", color: active ? a.accent : "rgba(100,116,139,0.8)", fontWeight: active ? 700 : 400 }}>{a.label.toUpperCase()}</span>
                <span style={{ fontFamily:"monospace", fontSize:7, letterSpacing:"0.06em", color: active ? `${a.accent}bb` : "rgba(100,116,139,0.4)", marginTop:1 }}>{a.modeHint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes areaFlash { 0%{opacity:0.4} 100%{opacity:0} }
        @keyframes hintFloat {
          0%  {opacity:0;transform:translateX(-50%) translateY(4px)}
          15% {opacity:1;transform:translateX(-50%) translateY(0)}
          75% {opacity:1}
          100%{opacity:0}
        }
        @keyframes thoughtPop {
          0%   {opacity:0;transform:translateX(-50%) scale(0.85)}
          12%  {opacity:1;transform:translateX(-50%) scale(1.04)}
          20%  {transform:translateX(-50%) scale(1)}
          78%  {opacity:1}
          100% {opacity:0;transform:translateX(-50%) scale(0.95)}
        }
        @keyframes sleepyFloat {
          0%   {transform:translateY(0) scale(1);   opacity:0.75}
          50%  {transform:translateY(-10px) scale(1.1); opacity:0.9}
          100% {transform:translateY(0) scale(1);   opacity:0.75}
        }
      `}</style>
    </WorldMap>
  );
}

// Static star field
const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: `${((i * 137.508) % 100).toFixed(2)}%`,
  y: `${((i * 97.3)   % 100).toFixed(2)}%`,
  r: i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
}));
