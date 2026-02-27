"use client";

import { useState, useEffect, useCallback } from "react";
import type { Shul, ShulSchedule, ScheduleOverride, ShulAdminRole, DayKey, NusachType, OverrideType } from "@/lib/types";
import {
    fetchUserShuls,
    registerShul,
    updateShul,
    fetchShulSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    fetchShulOverrides,
    createOverride,
    deleteOverride,
} from "@/services/supabase/shuls";

export type ShulState = {
    loading: boolean;
    shul: Shul | null;
    role: ShulAdminRole | null;
    schedules: ShulSchedule[];
    overrides: ScheduleOverride[];
    refresh: () => Promise<void>;
    register: (
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
    ) => Promise<{ error: string | null }>;
    updateShulInfo: (updates: Partial<Pick<Shul, "name" | "address" | "lat" | "lng" | "nusach" | "contact_email" | "contact_phone" | "website">>) => Promise<{ error: string | null }>;
    addSchedule: (input: {
        tefillah: "SHACHARIS" | "MINCHA" | "MAARIV";
        days: DayKey[];
        start_time: string;
        name?: string;
        notes?: string;
    }) => Promise<{ error: string | null }>;
    editSchedule: (id: string, updates: Partial<Pick<ShulSchedule, "tefillah" | "days" | "start_time" | "name" | "notes" | "active">>) => Promise<{ error: string | null }>;
    removeSchedule: (id: string) => Promise<{ error: string | null }>;
    addOverride: (input: {
        schedule_id?: string;
        override_date: string;
        override_type: OverrideType;
        new_time?: string;
        tefillah?: "SHACHARIS" | "MINCHA" | "MAARIV";
        reason?: string;
    }) => Promise<{ error: string | null }>;
    removeOverride: (id: string) => Promise<{ error: string | null }>;
};

export function useShul(userId: string | undefined): ShulState {
    const [loading, setLoading] = useState(true);
    const [shul, setShul] = useState<Shul | null>(null);
    const [role, setRole] = useState<ShulAdminRole | null>(null);
    const [schedules, setSchedules] = useState<ShulSchedule[]>([]);
    const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);

    const refresh = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const userShuls = await fetchUserShuls(userId);
            if (userShuls.length > 0) {
                const first = userShuls[0];
                setShul(first.shul);
                setRole(first.role);

                const [scheds, overs] = await Promise.all([
                    fetchShulSchedules(first.shul.id),
                    fetchShulOverrides(first.shul.id, new Date().toISOString().split("T")[0]),
                ]);
                setSchedules(scheds);
                setOverrides(overs);
            } else {
                setShul(null);
                setRole(null);
                setSchedules([]);
                setOverrides([]);
            }
        } catch (err) {
            console.error("[useShul] Error:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const register = useCallback(
        async (
            shulData: Parameters<typeof registerShul>[1],
            scheduleData: Parameters<typeof registerShul>[2]
        ) => {
            if (!userId) return { error: "Not signed in" };
            const result = await registerShul(userId, shulData, scheduleData);
            if (!result.error) await refresh();
            return { error: result.error };
        },
        [userId, refresh]
    );

    const updateShulInfo = useCallback(
        async (updates: Parameters<typeof updateShul>[1]) => {
            if (!shul) return { error: "No shul" };
            const result = await updateShul(shul.id, updates);
            if (!result.error) await refresh();
            return result;
        },
        [shul, refresh]
    );

    const addSchedule = useCallback(
        async (input: {
            tefillah: "SHACHARIS" | "MINCHA" | "MAARIV";
            days: DayKey[];
            start_time: string;
            name?: string;
            notes?: string;
        }) => {
            if (!shul) return { error: "No shul" };
            const result = await createSchedule({ shul_id: shul.id, ...input });
            if (!result.error) await refresh();
            return { error: result.error };
        },
        [shul, refresh]
    );

    const editSchedule = useCallback(
        async (id: string, updates: Parameters<typeof updateSchedule>[1]) => {
            const result = await updateSchedule(id, updates);
            if (!result.error) await refresh();
            return result;
        },
        [refresh]
    );

    const removeSchedule = useCallback(
        async (id: string) => {
            const result = await deleteSchedule(id);
            if (!result.error) await refresh();
            return result;
        },
        [refresh]
    );

    const addOverride = useCallback(
        async (input: Omit<Parameters<typeof createOverride>[0], "shul_id">) => {
            if (!shul) return { error: "No shul" };
            const result = await createOverride({ shul_id: shul.id, ...input });
            if (!result.error) await refresh();
            return { error: result.error };
        },
        [shul, refresh]
    );

    const removeOverride = useCallback(
        async (id: string) => {
            const result = await deleteOverride(id);
            if (!result.error) await refresh();
            return result;
        },
        [refresh]
    );

    return {
        loading,
        shul,
        role,
        schedules,
        overrides,
        refresh,
        register,
        updateShulInfo,
        addSchedule,
        editSchedule,
        removeSchedule,
        addOverride,
        removeOverride,
    };
}
