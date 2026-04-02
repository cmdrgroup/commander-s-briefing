import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("GHL webhook received:", JSON.stringify(body));

    // Extract operator identifiers - GHL sends these in various formats
    const email = body.email || body.contact?.email || body.fields?.email;
    const firstName = body.first_name || body.contact?.firstName || body.fields?.first_name || body.firstName;
    const lastName = body.last_name || body.contact?.lastName || body.fields?.last_name || body.lastName;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "No email found in webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Strip out metadata fields, keep only intake form answers
    const metaFields = ["email", "first_name", "last_name", "firstName", "lastName", "contact", "fields", "id", "contactId", "locationId", "type", "timestamp"];
    const intakeData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!metaFields.includes(key)) {
        intakeData[key] = value;
      }
    }
    // Also pull in nested fields if present
    if (body.fields && typeof body.fields === "object") {
      for (const [key, value] of Object.entries(body.fields)) {
        if (!["email", "first_name", "last_name"].includes(key)) {
          intakeData[key] = value;
        }
      }
    }

    // Find operator by email
    const { data: operator, error: findError } = await supabase
      .from("operators")
      .select("id, first_name, last_name")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (findError) {
      console.error("Error finding operator:", findError);
      throw new Error(`Database error: ${findError.message}`);
    }

    let operatorId: string;
    let operatorName: string;

    if (operator) {
      // Update existing operator with intake data
      const { error: updateError } = await supabase
        .from("operators")
        .update({ intake_data: intakeData })
        .eq("id", operator.id);

      if (updateError) throw new Error(`Update error: ${updateError.message}`);

      operatorId = operator.id;
      operatorName = `${operator.first_name} ${operator.last_name}`;
      console.log(`Updated intake_data for operator ${operatorId}`);
    } else {
      // Create new operator
      const slug = `${(firstName || "op").toLowerCase()}-${(lastName || "new").toLowerCase().charAt(0)}-${Math.random().toString(36).slice(2, 8)}`;
      
      const { data: newOp, error: insertError } = await supabase
        .from("operators")
        .insert({
          email: email.toLowerCase().trim(),
          first_name: firstName || "New",
          last_name: lastName || "Operator",
          slug,
          intake_data: intakeData,
          status: "not_started",
        })
        .select("id, first_name, last_name")
        .single();

      if (insertError) throw new Error(`Insert error: ${insertError.message}`);

      operatorId = newOp.id;
      operatorName = `${newOp.first_name} ${newOp.last_name}`;
      console.log(`Created new operator ${operatorId} from webhook`);
    }

    // Auto-generate charges from intake data
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let chargesGenerated = false;

    if (LOVABLE_API_KEY && Object.keys(intakeData).length > 0) {
      try {
        const generateUrl = `${supabaseUrl}/functions/v1/generate-charges`;
        const chargeResponse = await fetch(generateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            intakeData,
            operatorName,
          }),
        });

        if (chargeResponse.ok) {
          const chargeResult = await chargeResponse.json();
          const charges = chargeResult.charges || [];

          if (charges.length > 0) {
            const chargeRows = charges.map((c: Record<string, unknown>, i: number) => ({
              operator_id: operatorId,
              category: c.category,
              statement: c.statement,
              charge_level: c.chargeLevel || 5,
              priority_rank: c.priorityRank || null,
              sort_order: i,
              status: "not_started",
            }));

            const { error: chargeInsertError } = await supabase
              .from("charge_items")
              .insert(chargeRows);

            if (chargeInsertError) {
              console.error("Error inserting charges:", chargeInsertError);
            } else {
              chargesGenerated = true;
              console.log(`Generated ${charges.length} charges for operator ${operatorId}`);
            }
          }
        } else {
          console.error("Charge generation failed:", await chargeResponse.text());
        }
      } catch (genErr) {
        console.error("Charge generation error:", genErr);
      }
    }

    // Auto-load default roadmap template
    let roadmapLoaded = false;
    try {
      // Check if roadmap items already exist
      const { data: existingItems } = await supabase
        .from("roadmap_items")
        .select("id")
        .eq("operator_id", operatorId)
        .limit(1);

      if (!existingItems || existingItems.length === 0) {
        const defaultItems = [
          // Phase 1 — Command Installation (Weeks 1–4)
          { phase: "phase_1", title: "Complete Pre-Deployment Manual Review", description: "Read the preparation document — what the Passage is, what it isn't, what's expected.", icon: "📋", target_week: 1 },
          { phase: "phase_1", title: "Complete Mind Clearing Inventory", description: "List every unresolved charge — who, what, rate 0-10. Create your clearing priority list for Phase 2.", icon: "🧠", target_week: 1 },
          { phase: "phase_1", title: "Begin Commander's 75", description: "Day 1 of daily compliance. Full standard. Tracked in the Commander's 75 app.", icon: "⚡", target_week: 1 },
          { phase: "phase_1", title: "Complete Time Audit", description: "Track every 30-minute block for 7 days. Where does the time actually go?", icon: "⏱️", target_week: 2 },
          { phase: "phase_1", title: "Submit First SITREP", description: "Current state of business, home, and self. Honest. No performance.", icon: "📝", target_week: 2 },
          { phase: "phase_1", title: "Complete Physical Baseline", description: "Record: body weight, resting heart rate, push-ups (2 min), sit-ups (2 min), 2.4km run time.", icon: "💪", target_week: 2 },
          { phase: "phase_1", title: "Learn the Charge-Clearing Framework", description: "Review the 10 tools, the process, the principle.", icon: "📖", target_week: 3 },
          { phase: "phase_1", title: "First Clearing Session (BIG #1)", description: "Take the highest-rated charge from your inventory. Run the full protocol.", icon: "🎯", target_week: 3 },
          { phase: "phase_1", title: "Record Clearing Outcome", description: "Log: charge type, target, initial rating, final rating, new belief, committed action.", icon: "📊", target_week: 3 },
          { phase: "phase_1", title: "Complete Command Foundations Assessment", description: "Self-assessment against the Three Gates: responsibility, avoidance awareness, submission to structure.", icon: "🏛️", target_week: 4 },
          { phase: "phase_1", title: "Define 90-Day Strategic Objectives", description: "Three domains — Business, Home, Self. Measurable. Specific. Time-bound.", icon: "🗺️", target_week: 4 },
          { phase: "phase_1", title: "Submit SITREP + Compliance Review", description: "Honest 4-week review. What's slipping? Where did you negotiate with the standard?", icon: "📝", target_week: 4 },
          // Phase 2 — Clearing Operations (Weeks 5–8)
          { phase: "phase_2", title: "Self-Doubt Clearing Session", description: "Where are you doubting yourself most — leader, husband, father, operator? Clear it.", icon: "🎯", target_week: 5 },
          { phase: "phase_2", title: "Submit SITREP", description: "Weekly situation report — progress, blockers, state of mind.", icon: "📝", target_week: 5 },
          { phase: "phase_2", title: "Fear & Anxiety Clearing Session", description: "What are you afraid of? The Passage? Failing? Being exposed? Your marriage? Name it. Clear it.", icon: "🎯", target_week: 6 },
          { phase: "phase_2", title: "Submit SITREP", description: "Weekly situation report — progress, blockers, state of mind.", icon: "📝", target_week: 6 },
          { phase: "phase_2", title: "Guilt & Shame Clearing Session", description: "Past failures, things you haven't told your wife, the double life. Clear it before the Passage exposes it.", icon: "🎯", target_week: 7 },
          { phase: "phase_2", title: "Judgment Clearing Session", description: "Fear of being judged by the other men, by Curtis, by yourself. Or judgment of others keeping you isolated.", icon: "🎯", target_week: 7 },
          { phase: "phase_2", title: "Submit SITREP", description: "Weekly situation report — progress, blockers, state of mind.", icon: "📝", target_week: 7 },
          { phase: "phase_2", title: "Resentment Clearing Session", description: "Who do you resent? Wife? Business partner? Parent? Yourself? Often the heaviest charge.", icon: "🎯", target_week: 8 },
          { phase: "phase_2", title: "Frustration Clearing Session", description: "What frustrates you most? Usually a conversation you haven't had or an expectation you haven't enforced.", icon: "🎯", target_week: 8 },
          { phase: "phase_2", title: "Charge Inventory Review", description: "Revisit Week 1 inventory. What's cleared? What remains? What surfaced? Re-rate everything.", icon: "📊", target_week: 8 },
          { phase: "phase_2", title: "Submit SITREP", description: "Weekly situation report — progress, blockers, state of mind.", icon: "📝", target_week: 8 },
          // Phase 3 — Edge & Integration (Weeks 9–11)
          { phase: "phase_3", title: "Clear Remaining Charges", description: "Anything still rated 7+ gets cleared. If you've been avoiding one — that's the one.", icon: "🎯", target_week: 9 },
          { phase: "phase_3", title: "90-Day Objectives Check-In", description: "Revisit Week 4 objectives. Still the right targets? Refine.", icon: "🗺️", target_week: 9 },
          { phase: "phase_3", title: "Submit SITREP", description: "Weekly situation report — progress, blockers, state of mind.", icon: "📝", target_week: 9 },
          { phase: "phase_3", title: "Physical Readiness Check", description: "Re-test Week 2 baseline. Has it improved? Commander's 75 movement should show results.", icon: "💪", target_week: 10 },
          { phase: "phase_3", title: "Prepare the Home Front", description: "Off-grid 5 days. Wife informed? Team briefed? Delegation set? If not — fix it this week.", icon: "🏠", target_week: 10 },
          { phase: "phase_3", title: "Submit SITREP", description: "Weekly situation report — progress, blockers, state of mind.", icon: "📝", target_week: 10 },
          { phase: "phase_3", title: "Complete Packing List", description: "Everything packed. Ready by end of this week, not the night before.", icon: "🎒", target_week: 11 },
          { phase: "phase_3", title: "Write Letter to Self", description: "Who you are today. What you're afraid of. What you're avoiding. What you hope to become. Sealed. Opened post-Passage.", icon: "✉️", target_week: 11 },
          { phase: "phase_3", title: "Submit Final SITREP", description: "Last pre-Passage report. Charges cleared to date. Commander's 75 summary. The baseline for post-Passage measurement.", icon: "📝", target_week: 11 },
          // Phase 4 — Deployment (Week 12)
          { phase: "phase_4", title: "Arrive", description: "On time. Prepared. Ready.", icon: "🚀", target_week: 12 },
          { phase: "phase_4", title: "Post-Passage Debrief", description: "What broke? What did you see? What do you now believe is true? What do you commit to?", icon: "📋", target_week: 12 },
          { phase: "phase_4", title: "Transition Plan", description: "Where next? Protocol? Command Room? 90-day execution plan.", icon: "🗺️", target_week: 12 },
        ];

        const roadmapRows = defaultItems.map((item, i) => ({
          operator_id: operatorId,
          phase: item.phase,
          item_type: "standard",
          title: item.title,
          description: item.description,
          icon: item.icon,
          target_week: item.target_week,
          sort_order: i,
        }));

        const { error: roadmapError } = await supabase
          .from("roadmap_items")
          .insert(roadmapRows);

        if (roadmapError) {
          console.error("Error inserting roadmap:", roadmapError);
        } else {
          roadmapLoaded = true;
          console.log(`Loaded ${roadmapRows.length} roadmap items for operator ${operatorId}`);
        }
      } else {
        console.log("Roadmap already exists, skipping template load");
      }
    } catch (roadmapErr) {
      console.error("Roadmap loading error:", roadmapErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        operator_id: operatorId,
        charges_generated: chargesGenerated,
        roadmap_loaded: roadmapLoaded,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ghl-webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
