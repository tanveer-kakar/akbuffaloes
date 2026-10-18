import { backend } from "@/lib/backendClient";

interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
}

export const logActivity = async ({ action, entityType, entityId, details }: LogActivityParams) => {
  try {
    const { data: { user }, error: userError } = await backend.auth.getUser();
    if (userError) {
      console.error("Activity log user lookup failed:", userError);
      return;
    }
    if (!user) return;

    const { data: roleData, error: roleError } = await backend.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (roleError) console.error("Activity log role lookup failed:", roleError);

    const { error: insertError } = await backend.from("activity_logs").insert({
      user_id: user.id,
      user_email: user.email || null,
      user_role: roleData ? "admin" : "user",
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    });
    if (insertError) console.error("Activity log insert failed:", insertError);
  } catch (e) {
    console.error("Activity log failed:", e);
  }
};
