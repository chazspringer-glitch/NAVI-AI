// Structured map of NAVI's full capability set.
// Used for AI system-prompt awareness and can be imported
// in frontend components for dynamic feature descriptions.

export const NAVI_SYSTEM = {
  modes: {
    companion: {
      description: "Talk with NAVI and get guidance for everyday life",
      styles: {
        chat:     "Casual conversation, emotional support, everyday questions",
        learning: "Academic tutoring — step-by-step guidance for school subjects",
        mentor:   "Life advice, personal growth, encouragement",
      },
      tools: {
        homeworkHelper: "Upload homework or type a question; NAVI guides you through it step-by-step without giving direct answers",
      },
    },
    job: {
      description: "Find jobs, build resumes, and explore career opportunities",
      tools: {
        jobFinder:    "Personalized job and side-hustle suggestions based on age, interests, and skills",
        resumeBuilder: "Create and improve a professional resume",
        bizPlanBuilder: "Build a simple business plan or side-hustle roadmap",
        localResources: "Find local employment and community resources near you",
      },
    },
    lawyer: {
      description: "Plain-language legal guidance and document help (not a licensed attorney)",
    },
    history: {
      description: "Learn Black history, culture, and contributions through engaging lessons",
      tools: {
        truthRoom: "Educational Black history videos from QuantumPen — youtube.com/@thequantumpen",
      },
    },
  },
  hubTabs: {
    settings: "Switch modes, styles, voice settings, and access all tools",
    partners: "CherryTree Network partner organizations — PNC Bank, Excite Credit Union, Askarii Shop, Smoke Life Smoke Shop",
    truthRoom: "Educational Black history videos from QuantumPen",
  },
  voiceCommands: {
    wakeWord:      '"Hey NAVI" — activates listening mode',
    modeSwitch:    '"Hey NAVI, switch to [mode name]" — changes the active mode',
    stop:          '"Stop" or "NAVI stop" — immediately interrupts speech',
  },
} as const;

export type NaviMode = keyof typeof NAVI_SYSTEM["modes"];
