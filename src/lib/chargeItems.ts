import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const CHARGE_CATEGORIES = [
  { key: "anger", label: "Anger", emoji: "😡", prefix: "I feel angry that..." },
  { key: "resentment", label: "Resentment", emoji: "😒", prefix: "I resent..." },
  { key: "frustration", label: "Frustration", emoji: "🤬", prefix: "I'm frustrated that..." },
  { key: "fear_anxiety", label: "Fear & Anxiety", emoji: "😬", prefix: "I fear..." },
  { key: "self_doubt", label: "Self Doubt", emoji: "😟", prefix: "I doubt..." },
  { key: "guilt_shame", label: "Guilt & Shame", emoji: "😣", prefix: "I feel guilty for..." },
  { key: "judgment", label: "Judgment", emoji: "👁️", prefix: "I judge myself for..." },
  { key: "infatuation", label: "Infatuation", emoji: "❤️", prefix: "I'm attached to..." },
  { key: "depression", label: "Depression", emoji: "😔", prefix: "I feel hopeless about..." },
  { key: "grief_loss", label: "Grief & Loss", emoji: "💔", prefix: "I grieve..." },
] as const;

export type ChargeCategory = typeof CHARGE_CATEGORIES[number]["key"];
export type ChargeStatus = Database["public"]["Enums"]["charge_status"];
export type ChargeDomain = "business" | "home" | "self" | "both";
export type ChargeSource = "stated" | "implied" | "universal" | "blind_spot" | "self_reported";

export type ChargeItem = Database["public"]["Tables"]["charge_items"]["Row"] & {
  domain?: string | null;
  source?: string | null;
  evidence?: string | null;
  is_cleared?: boolean;
  cleared_at?: string | null;
  review_rating?: number | null;
  blind_spot_question?: string | null;
};

export type ClearingLog = Database["public"]["Tables"]["clearing_logs"]["Row"];

export const DOMAIN_LABELS: Record<string, { emoji: string; label: string }> = {
  business: { emoji: "🏢", label: "Business" },
  home: { emoji: "🏠", label: "Home" },
  self: { emoji: "👤", label: "Self" },
  both: { emoji: "🔄", label: "Both" },
};

export const SOURCE_LABELS: Record<string, { emoji: string; label: string }> = {
  stated: { emoji: "📋", label: "Stated" },
  implied: { emoji: "📊", label: "Implied" },
  universal: { emoji: "🌐", label: "Universal" },
  blind_spot: { emoji: "🔍", label: "Blind Spot" },
  self_reported: { emoji: "✍️", label: "Self-Reported" },
};

export async function getChargeItems(operatorId: string): Promise<ChargeItem[]> {
  const { data, error } = await supabase
    .from("charge_items")
    .select("*")
    .eq("operator_id", operatorId)
    .order("category")
    .order("sort_order");
  if (error) throw error;
  return (data || []) as ChargeItem[];
}

export async function addChargeItem(
  operatorId: string,
  category: string,
  statement: string,
  chargeLevel: number = 5,
  sortOrder: number = 0,
  extras?: { domain?: string; source?: string; evidence?: string; blind_spot_question?: string }
): Promise<ChargeItem> {
  const insertData: any = {
    operator_id: operatorId,
    category,
    statement,
    charge_level: chargeLevel,
    sort_order: sortOrder,
    domain: extras?.domain || "both",
    source: extras?.source || "self_reported",
    evidence: extras?.evidence || null,
    blind_spot_question: extras?.blind_spot_question || null,
  };

  const { data, error } = await supabase
    .from("charge_items")
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return data as ChargeItem;
}

export async function updateChargeItem(id: string, updates: Partial<{
  statement: string;
  charge_level: number;
  current_charge_level: number | null;
  priority_rank: number | null;
  status: ChargeStatus;
  command_notes: string | null;
  sort_order: number;
  is_cleared: boolean;
  cleared_at: string | null;
  review_rating: number | null;
  source: string | null;
}>): Promise<void> {
  const { error } = await supabase.from("charge_items").update(updates as any).eq("id", id);
  if (error) throw error;
}

export async function deleteChargeItem(id: string): Promise<void> {
  const { error } = await supabase.from("charge_items").delete().eq("id", id);
  if (error) throw error;
}

export async function getClearingLogs(chargeId: string): Promise<ClearingLog[]> {
  const { data, error } = await supabase
    .from("clearing_logs")
    .select("*")
    .eq("charge_id", chargeId)
    .order("logged_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addClearingLog(
  chargeId: string,
  operatorId: string,
  preClearingLevel: number,
  postClearingLevel: number,
  operatorNotes?: string
): Promise<void> {
  const { error } = await supabase.from("clearing_logs").insert({
    charge_id: chargeId,
    operator_id: operatorId,
    pre_clearing_level: preClearingLevel,
    post_clearing_level: postClearingLevel,
    operator_notes: operatorNotes || null,
  });
  if (error) throw error;
  await updateChargeItem(chargeId, {
    current_charge_level: postClearingLevel,
    status: postClearingLevel === 0 ? "cleared" : "in_progress",
    ...(postClearingLevel === 0 ? { is_cleared: true, cleared_at: new Date().toISOString() } : {}),
  });
}

export function getCategoryInfo(key: string) {
  return CHARGE_CATEGORIES.find(c => c.key === key);
}
