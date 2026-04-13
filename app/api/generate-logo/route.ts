import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";

export const runtime     = "nodejs";
export const maxDuration = 60;

// ── Single source of truth in lib/emailConfig.ts ─────────────────────────────
const OWNER_EMAIL = EMAIL_RECEIVER;

let _openai: OpenAI | null = null;
function getClient(key: string): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: key });
  return _openai;
}

interface RequestBody {
  businessName: string;
  clientEmail:  string;
  tagline?:     string;
  industry:     string;
  style:        string;
  colors:       string;
  symbols?:     string;
  vibe:         string;
}

interface LogoResult {
  url:         string;
  description: string;
  variation:   number;
}

const STYLE_DESC: Record<string, string> = {
  modern:  "clean, contemporary, minimalist with sharp geometry and modern sans-serif type",
  luxury:  "premium, elegant, sophisticated with refined detail and high-end visual language",
  bold:    "strong, impactful, high-contrast with powerful statement typography",
  minimal: "ultra-clean, simple, generous whitespace with restrained and refined visual elements",
};

function buildLogoPrompt(body: RequestBody, variation: number): string {
  const { businessName, tagline, industry, style, colors, symbols, vibe } = body;

  const styleDesc = STYLE_DESC[style.toLowerCase()] ?? style;

  const symbolNote =
    symbols && !["none", "skip", "n/a", "no"].includes(symbols.toLowerCase().trim())
      ? `Include these visual elements: ${symbols}.`
      : "Use elegant abstract shapes, monogram, or minimal lettermark as the icon.";

  const taglineNote =
    tagline && !["skip", "n/a", "none", "no"].includes(tagline.toLowerCase().trim())
      ? `Include the tagline: "${tagline}" in smaller type beneath the business name.`
      : "";

  const layouts = [
    "wordmark layout with icon centered above the business name",
    "horizontal lockup with icon to the left and stacked name/tagline to the right",
  ];

  return `A professional logo design for "${businessName}", a ${industry} brand.

Style: ${styleDesc}.
Color palette: ${colors}.
Brand vibe: ${vibe}.
Layout: ${layouts[variation] ?? layouts[0]}.
${symbolNote}
${taglineNote}

Requirements:
- Professional, market-ready, and polished — suitable for a real business
- Clean flat vector illustration style, centered on a pure white background
- Strong visual hierarchy, legible typography at any size
- No decorative frames, borders, drop shadows, or gradient backgrounds
- No watermarks, no extra text, no placeholder copy
- The business name must appear clearly and correctly spelled`;
}

async function generateOne(client: OpenAI, prompt: string): Promise<string | null> {
  try {
    const result = await client.images.generate({
      model:   "dall-e-3",
      prompt,
      n:       1,
      size:    "1024x1024",
      quality: "hd",
      style:   "natural",
    });
    return result.data?.[0]?.url ?? null;
  } catch (err) {
    console.error("[generate-logo] DALL-E 3 error:", err);
    return null;
  }
}

async function sendEmailJS(params: Record<string, string>): Promise<boolean> {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("[generate-logo] EmailJS credentials not configured — skipping email send.");
    return false;
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:      serviceId,
        template_id:     templateId,
        user_id:         publicKey,
        template_params: params,
      }),
    });

    if (!res.ok) {
      console.error(`[generate-logo] EmailJS ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[generate-logo] EmailJS network error:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Service not configured." }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { businessName, clientEmail, tagline, industry, style, colors, symbols, vibe } = body;

  if (!businessName?.trim() || !industry?.trim()) {
    return NextResponse.json({ error: "Business name and industry are required." }, { status: 400 });
  }

  const client = getClient(apiKey);

  // Generate 2 variations in parallel to minimize latency
  const [url1, url2] = await Promise.all([
    generateOne(client, buildLogoPrompt(body, 0)),
    generateOne(client, buildLogoPrompt(body, 1)),
  ]);

  const logos: LogoResult[] = [
    url1 ? { url: url1, description: "Primary — Wordmark Stack",      variation: 1 } : null,
    url2 ? { url: url2, description: "Alternative — Horizontal Lock",  variation: 2 } : null,
  ].filter((x): x is LogoResult => x !== null);

  if (logos.length === 0) {
    return NextResponse.json({ error: "Logo generation failed. Please try again." }, { status: 500 });
  }

  const submissionDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const logoLinksText = logos
    .map((l, i) => `Logo ${i + 1} — ${l.description}:\n${l.url}`)
    .join("\n\n");

  const intakeSummary = [
    `LOGO GENERATOR — ${businessName}`,
    `Industry: ${industry}`,
    `Style: ${style}`,
    `Colors: ${colors}`,
    `Vibe: ${vibe}`,
    tagline  ? `Tagline: ${tagline}`   : null,
    symbols  ? `Symbols: ${symbols}`  : null,
    "",
    "Generated Logo Links (valid ~1 hour):",
    logoLinksText,
  ].filter((x) => x !== null).join("\n");

  // Owner copy
  const ownerSent = await sendEmailJS({
    to_email:           OWNER_EMAIL,
    reply_to:           clientEmail || OWNER_EMAIL,
    client_name:        businessName,
    business_name:      businessName,
    client_email:       clientEmail || "Not provided",
    service:            "Logo Generator",
    submission_date:    submissionDate,
    work_order_summary: intakeSummary,
    objectives:         `Style: ${style} | Industry: ${industry} | Colors: ${colors}`,
    deliverables:       logos.map((l, i) => `${i + 1}. ${l.description}: ${l.url}`).join("\n"),
    timeline:           "Completed — delivered instantly",
    notes:              [vibe, symbols, tagline].filter(Boolean).join(" | "),
    winning_angle:      `AI-generated logo designs (${logos.length} variations) for ${businessName}`,
    approach:           `DALL-E 3 HD generation with custom branding prompts`,
    content_ideas:      "",
    growth_direction:   "",
    next_steps:         "1. Review logos with client\n2. Provide final vector files if requested\n3. Follow up within 24 hours",
    service_qa:         intakeSummary,
    full_intake:        intakeSummary,
  });

  // Client copy (if email provided)
  let clientSent = false;
  if (clientEmail?.trim()) {
    const clientBody = [
      `Hi ${businessName}! Your logo designs from NAVI are ready.`,
      "",
      "Please download your logos using the links below.",
      "⚠ These links expire in approximately 1 hour — save your images right away.",
      "",
      logoLinksText,
      "",
      `Have questions or want revisions? Reply to this email or reach us at ${OWNER_EMAIL}.`,
      "",
      "— The Springer Industries Team",
    ].join("\n");

    clientSent = await sendEmailJS({
      to_email:           clientEmail,
      reply_to:           OWNER_EMAIL,
      client_name:        businessName,
      business_name:      businessName,
      client_email:       clientEmail,
      service:            "Logo Generator",
      submission_date:    submissionDate,
      work_order_summary: clientBody,
      objectives:         `${logos.length} logo variations generated`,
      deliverables:       logos.map((l, i) => `${i + 1}. ${l.description}: ${l.url}`).join("\n"),
      timeline:           "Instant delivery",
      notes:              "Download links expire in ~1 hour. Please save your images promptly.",
      winning_angle:      `Your custom logo designs for ${businessName}`,
      approach:           "Review the logos below and contact us for any changes.",
      content_ideas:      "",
      growth_direction:   "",
      next_steps:         "1. Open each link\n2. Right-click → Save Image\n3. Use across your brand materials",
      service_qa:         "",
      full_intake:        intakeSummary,
    });
  }

  console.log(`[generate-logo] ${logos.length} logos for "${businessName}" | owner=${ownerSent} client=${clientSent}`);

  return NextResponse.json({ logos, emailSent: ownerSent, clientEmailSent: clientSent });
}
