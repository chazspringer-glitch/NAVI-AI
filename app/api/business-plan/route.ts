import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";

export const runtime     = "nodejs";
export const maxDuration = 60;

let _openai: OpenAI | null = null;
function getClient(key: string): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: key });
  return _openai;
}

interface RequestBody {
  businessName:     string;
  businessType:     string;
  targetAudience:   string;
  problemSolved:    string;
  servicesProducts: string;
  revenueModel:     string;
  startupBudget:    string;
  growthGoals:      string;
  userEmail:        string;
}

interface BusinessPlanSections {
  companyOverview:              string;
  founderAdvantage:             string;
  companyAdvantages:            string;
  industryOverview:             string;
  marketResearch:               string;
  marketGapOpportunity:         string;
  targetCustomers:              string;
  productsServices:             string;
  operatingModel:               string;
  strategicPositioning:         string;
  dataInfrastructureAdvantage:  string;
  growthStrategy:               string;
  threeYearGrowthVision:        string;
  financialOverviewBudget:      string;
  revenueModel:                 string;
  fundingRequestCapital:        string;
  vision:                       string;
  summary:                      string;
}

const SECTION_LABELS: Record<keyof BusinessPlanSections, string> = {
  companyOverview:              "Company Overview",
  founderAdvantage:             "Founder Advantage",
  companyAdvantages:            "Company Advantages",
  industryOverview:             "Industry Overview",
  marketResearch:               "Market Research",
  marketGapOpportunity:         "Market Gap & Opportunity",
  targetCustomers:              "Target Customers",
  productsServices:             "Products and Services",
  operatingModel:               "Operating Model",
  strategicPositioning:         "Strategic Positioning",
  dataInfrastructureAdvantage:  "Data Infrastructure Advantage",
  growthStrategy:               "Growth Strategy",
  threeYearGrowthVision:        "Three-Year Growth Vision",
  financialOverviewBudget:      "Financial Overview & Budget",
  revenueModel:                 "Revenue Model",
  fundingRequestCapital:        "Funding Request & Use of Capital",
  vision:                       "Vision",
  summary:                      "Summary",
};

const SYSTEM_PROMPT = `You are a senior business strategist at Springer Industries — an AI-powered marketing and automation company. Generate a comprehensive, investor-ready business plan using the Springer Industries 18-section framework.

Return ONLY valid JSON with this exact structure — no markdown, no extra keys:
{
  "companyName": "string",
  "sections": {
    "companyOverview": "string — 2-3 sentences on what the company does, its mission, and core value proposition",
    "founderAdvantage": "string — 2-3 sentences on the founder's unique background and why they are positioned to win",
    "companyAdvantages": "string — 2-3 sentences on competitive moats, unique capabilities, and strategic advantages",
    "industryOverview": "string — 2-3 sentences on the industry landscape, key trends, and market dynamics",
    "marketResearch": "string — 2-3 sentences on market size, growth rate, and key data points",
    "marketGapOpportunity": "string — 2-3 sentences on the specific gap in the market this business fills",
    "targetCustomers": "string — 2-3 sentences on customer segments, demographics, and buying behavior",
    "productsServices": "string — 2-3 sentences describing the core offerings in detail",
    "operatingModel": "string — 2-3 sentences on how the business operates day-to-day and delivery model",
    "strategicPositioning": "string — 2-3 sentences on how the business is positioned vs. competitors",
    "dataInfrastructureAdvantage": "string — 2-3 sentences on technology, data, or automation that creates leverage",
    "growthStrategy": "string — 2-3 sentences on customer acquisition, channels, and scaling approach",
    "threeYearGrowthVision": "string — specific milestones and targets for years 1, 2, and 3",
    "financialOverviewBudget": "string — 2-3 sentences on startup costs, operating expenses, and projected revenue",
    "revenueModel": "string — 2-3 sentences on pricing strategy, revenue streams, and unit economics",
    "fundingRequestCapital": "string — 2-3 sentences on funding needs and how capital will be deployed",
    "vision": "string — 1-2 inspiring sentences on the 5-10 year vision and impact this business will create",
    "summary": "string — 3-4 sentence executive summary capturing the entire plan"
  }
}`;

// ── EmailJS send helper ───────────────────────────────────────────────────────

async function sendViaEmailJS(params: Record<string, string>): Promise<boolean> {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("[business-plan] EmailJS credentials not configured — skipping email send.");
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
      const body = await res.text();
      console.error(`[business-plan] EmailJS failed (${res.status}): ${body}`);
      return false;
    }

    console.log(`[business-plan] Business plan sent to ${params.to_email}`);
    return true;
  } catch (err) {
    console.error("[business-plan] EmailJS network error:", err);
    return false;
  }
}

// ── POST /api/business-plan ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API not configured." }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    businessName, businessType, targetAudience, problemSolved,
    servicesProducts, revenueModel, startupBudget, growthGoals, userEmail,
  } = body;

  if (!businessName?.trim()) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const userPrompt = `Business Name: ${businessName}
Business Type: ${businessType || "Not specified"}
Target Audience: ${targetAudience || "Not specified"}
Problem Solved: ${problemSolved || "Not specified"}
Products / Services: ${servicesProducts || "Not specified"}
Revenue Model: ${revenueModel || "Not specified"}
Startup Budget: ${startupBudget || "Not specified"}
Growth Goals: ${growthGoals || "Not specified"}

Generate a comprehensive, investor-ready 18-section business plan tailored to this company.`;

  let plan: BusinessPlanSections;
  let companyName: string;

  try {
    const openai = getClient(apiKey);
    const completion = await openai.chat.completions.create({
      model:           "gpt-4o-mini",
      max_tokens:      4000,
      temperature:     0.72,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt    },
      ],
    });

    const raw    = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { companyName?: string; sections?: BusinessPlanSections };

    if (!parsed.sections) {
      throw new Error("Incomplete response from model");
    }

    companyName = parsed.companyName ?? businessName;
    plan        = parsed.sections;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // ── Build full plan text for email ────────────────────────────────────────

  const fullPlanText = (Object.keys(SECTION_LABELS) as Array<keyof BusinessPlanSections>)
    .map((key, i) => `${i + 1}. ${SECTION_LABELS[key].toUpperCase()}\n${plan[key] ?? ""}`)
    .join("\n\n─────────────────\n\n");

  const submissionDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const baseParams = {
    client_name:      companyName,
    business_name:    companyName,
    client_email:     userEmail || "Not provided",
    service:          "Business Plan — Springer Industries Framework",
    submission_date:  submissionDate,
    reply_to:         userEmail || EMAIL_RECEIVER,

    // Map plan sections to work-order template fields
    work_order_summary: plan.summary ?? "",
    objectives:         plan.companyOverview ?? "",
    deliverables:       `18-Section Professional Business Plan for ${companyName}`,
    timeline:           "Delivered immediately via AI generation",
    notes:              `Growth Goals: ${growthGoals}\n\nVision: ${plan.vision ?? ""}`,
    winning_angle:      plan.strategicPositioning ?? "",
    approach:           plan.growthStrategy ?? "",
    content_ideas:      plan.threeYearGrowthVision ?? "",
    growth_direction:   plan.vision ?? "",
    next_steps:         plan.fundingRequestCapital ?? "",
    service_qa:         `Business Type: ${businessType}\nRevenue Model: ${revenueModel}\nStartup Budget: ${startupBudget}`,
    full_intake:        fullPlanText,
  };

  // Send to owner (always)
  const emailSent = await sendViaEmailJS({ ...baseParams, to_email: EMAIL_RECEIVER });

  // Send to user if provided and not the same as owner
  let userEmailSent = false;
  const normalizedUser  = userEmail?.trim().toLowerCase();
  const normalizedOwner = EMAIL_RECEIVER.toLowerCase();
  if (normalizedUser && normalizedUser !== normalizedOwner) {
    userEmailSent = await sendViaEmailJS({ ...baseParams, to_email: userEmail.trim() });
  }

  if (!emailSent) {
    console.log(`[business-plan] Email not sent via EmailJS. Destination would be: ${EMAIL_RECEIVER}`);
  }

  return NextResponse.json({ plan, companyName, emailSent, userEmailSent });
}
