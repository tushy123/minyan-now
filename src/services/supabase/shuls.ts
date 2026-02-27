import { supabase } from "@/lib/supabaseClient";
import type {
    Shul,
    ShulSchedule,
    ScheduleOverride,
    ShulAdmin,
    NusachType,
    DayKey,
    ShulAdminRole,
    OverrideType,
} from "@/lib/types";

// ==================== Shul CRUD ====================

export async function createShul(input: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    nusach?: NusachType;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
}): Promise<{ data: Shul | null; error: string | null }> {
    if (!supabase) return { data: null, error: "Supabase not configured" };

    const { data, error } = await supabase
        .from("shuls")
        .insert({
            name: input.name.trim(),
            address: input.address.trim(),
            lat: input.lat,
            lng: input.lng,
            nusach: input.nusach ?? null,
            contact_email: input.contact_email?.trim() ?? null,
            contact_phone: input.contact_phone?.trim() ?? null,
            website: input.website?.trim() ?? null,
        })
        .select("*")
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Shul, error: null };
}

export async function updateShul(
    shulId: string,
    updates: Partial<Pick<Shul, "name" | "address" | "lat" | "lng" | "nusach" | "contact_email" | "contact_phone" | "website">>
): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase not configured" };

    const { error } = await supabase
        .from("shuls")
        .update(updates)
        .eq("id", shulId);

    return { error: error?.message ?? null };
}

export async function fetchShul(shulId: string): Promise<Shul | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("shuls")
        .select("*")
        .eq("id", shulId)
        .single();

    if (error) return null;
    return data as Shul;
}

export async function fetchAllShuls(): Promise<Shul[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("shuls")
        .select("*")
        .order("name", { ascending: true });

    if (error) return [];
    return (data ?? []) as Shul[];
}

export async function deleteShul(shulId: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase not configured" };

    const { error } = await supabase.from("shuls").delete().eq("id", shulId);
    return { error: error?.message ?? null };
}

// ==================== Shul Admin CRUD ====================

export async function addShulAdmin(
    shulId: string,
    userId: string,
    role: ShulAdminRole = "owner"
): Promise<{ data: ShulAdmin | null; error: string | null }> {
    if (!supabase) return { data: null, error: "Supabase not configured" };

    const { data, error } = await supabase
        .from("shul_admins")
        .insert({ shul_id: shulId, user_id: userId, role })
        .select("*")
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as ShulAdmin, error: null };
}

export async function fetchShulAdmins(shulId: string): Promise<ShulAdmin[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("shul_admins")
        .select("*")
        .eq("shul_id", shulId);

    if (error) return [];
    return (data ?? []) as ShulAdmin[];
}

export async function fetchUserShuls(userId: string): Promise<{ shul: Shul; role: ShulAdminRole }[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("shul_admins")
        .select("role, shul:shuls(*)")
        .eq("user_id", userId);

    if (error || !data) return [];

    return data
        .filter((row: Record<string, unknown>) => row.shul)
        .map((row: Record<string, unknown>) => ({
            shul: row.shul as Shul,
            role: row.role as ShulAdminRole,
        }));
}

export async function isShulAdmin(shulId: string, userId: string): Promise<boolean> {
    if (!supabase) return false;

    const { data } = await supabase
        .from("shul_admins")
        .select("id")
        .eq("shul_id", shulId)
        .eq("user_id", userId)
        .maybeSingle();

    return !!data;
}

export async function removeShulAdmin(adminId: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase not configured" };

    const { error } = await supabase.from("shul_admins").delete().eq("id", adminId);
    return { error: error?.message ?? null };
}

// ==================== Shul Schedule CRUD ====================

export async function createSchedule(input: {
    shul_id: string;
    tefillah: "SHACHARIS" | "MINCHA" | "MAARIV";
    days: DayKey[];
    start_time: string;
    name?: string;
    notes?: string;
}): Promise<{ data: ShulSchedule | null; error: string | null }> {
    if (!supabase) return { data: null, error: "Supabase not configured" };

    const { data, error } = await supabase
        .from("shul_schedules")
        .insert({
            shul_id: input.shul_id,
            tefillah: input.tefillah,
            days: input.days,
            start_time: input.start_time.trim(),
            name: input.name?.trim() ?? null,
            notes: input.notes?.trim() ?? null,
        })
        .select("*")
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as ShulSchedule, error: null };
}

export async function updateSchedule(
    scheduleId: string,
    updates: Partial<Pick<ShulSchedule, "tefillah" | "days" | "start_time" | "name" | "notes" | "active">>
): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase not configured" };

    const { error } = await supabase
        .from("shul_schedules")
        .update(updates)
        .eq("id", scheduleId);

    return { error: error?.message ?? null };
}

export async function fetchShulSchedules(shulId: string): Promise<ShulSchedule[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("shul_schedules")
        .select("*")
        .eq("shul_id", shulId)
        .eq("active", true)
        .order("start_time", { ascending: true });

    if (error) return [];
    return (data ?? []) as ShulSchedule[];
}

export async function deleteSchedule(scheduleId: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase not configured" };

    const { error } = await supabase.from("shul_schedules").delete().eq("id", scheduleId);
    return { error: error?.message ?? null };
}

// ==================== Schedule Override CRUD ====================

export async function createOverride(input: {
    shul_id: string;
    schedule_id?: string;
    override_date: string;
    override_type: OverrideType;
    new_time?: string;
    tefillah?: "SHACHARIS" | "MINCHA" | "MAARIV";
    reason?: string;
}): Promise<{ data: ScheduleOverride | null; error: string | null }> {
    if (!supabase) return { data: null, error: "Supabase not configured" };

    const { data, error } = await supabase
        .from("schedule_overrides")
        .insert({
            shul_id: input.shul_id,
            schedule_id: input.schedule_id ?? null,
            override_date: input.override_date,
            override_type: input.override_type,
            new_time: input.new_time?.trim() ?? null,
            tefillah: input.tefillah ?? null,
            reason: input.reason?.trim() ?? null,
        })
        .select("*")
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as ScheduleOverride, error: null };
}

export async function fetchShulOverrides(
    shulId: string,
    fromDate?: string
): Promise<ScheduleOverride[]> {
    if (!supabase) return [];

    let query = supabase
        .from("schedule_overrides")
        .select("*")
        .eq("shul_id", shulId)
        .order("override_date", { ascending: true });

    if (fromDate) {
        query = query.gte("override_date", fromDate);
    }

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as ScheduleOverride[];
}

export async function deleteOverride(overrideId: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase not configured" };

    const { error } = await supabase.from("schedule_overrides").delete().eq("id", overrideId);
    return { error: error?.message ?? null };
}

// ==================== Register Shul (Combined Operation) ====================

export async function registerShul(
    userId: string,
    shulData: {
        name: string;
        address: string;
        lat: number;
        lng: number;
        nusach?: NusachType;
        contact_email?: string;
        contact_phone?: string;
        website?: string;
    },
    schedules: {
        tefillah: "SHACHARIS" | "MINCHA" | "MAARIV";
        days: DayKey[];
        start_time: string;
        name?: string;
        notes?: string;
    }[]
): Promise<{ shul: Shul | null; error: string | null }> {
    // Step 1: Create the shul
    const { data: shul, error: shulError } = await createShul(shulData);
    if (shulError || !shul) return { shul: null, error: shulError ?? "Failed to create shul" };

    // Step 2: Add the user as owner
    const { error: adminError } = await addShulAdmin(shul.id, userId, "owner");
    if (adminError) {
        // Clean up: delete the shul if admin creation failed
        await deleteShul(shul.id);
        return { shul: null, error: adminError };
    }

    // Step 3: Create all schedules
    for (const schedule of schedules) {
        const { error: schedError } = await createSchedule({
            shul_id: shul.id,
            ...schedule,
        });
        if (schedError) {
            console.error("[registerShul] Failed to create schedule:", schedError);
            // Don't fail the whole registration, just log it
        }
    }

    return { shul, error: null };
}
