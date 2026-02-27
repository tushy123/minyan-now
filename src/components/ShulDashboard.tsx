"use client";

import { useState, useCallback } from "react";
import type { ShulState } from "@/hooks/useShul";
import type { DayKey, ShulSchedule } from "@/lib/types";

const DAY_OPTIONS: { key: DayKey; label: string; short: string }[] = [
    { key: "sun", label: "Sunday", short: "Sun" },
    { key: "mon", label: "Monday", short: "Mon" },
    { key: "tue", label: "Tuesday", short: "Tue" },
    { key: "wed", label: "Wednesday", short: "Wed" },
    { key: "thu", label: "Thursday", short: "Thu" },
    { key: "fri", label: "Friday", short: "Fri" },
    { key: "shabbat", label: "Shabbat", short: "Shab" },
];

const TEFILLAH_OPTIONS = [
    { key: "SHACHARIS" as const, label: "Shacharis", icon: "🌅" },
    { key: "MINCHA" as const, label: "Mincha", icon: "🌤" },
    { key: "MAARIV" as const, label: "Maariv", icon: "🌙" },
];

const NUSACH_OPTIONS = [
    { key: "ashkenaz" as const, label: "Ashkenaz" },
    { key: "sefard" as const, label: "Sefard" },
    { key: "edot_hamizrach" as const, label: "Edot HaMizrach" },
    { key: "other" as const, label: "Other" },
];

function formatDays(days: DayKey[]): string {
    if (days.length === 7) return "Daily";
    if (days.length === 5 && !days.includes("shabbat") && !days.includes("sun")) return "Mon-Fri";
    if (days.length === 6 && !days.includes("shabbat")) return "Sun-Fri";
    return days.map((d) => DAY_OPTIONS.find((o) => o.key === d)?.short ?? d).join(", ");
}

export function ShulDashboard({
    open,
    shulState,
    onClose,
    onToast,
}: {
    open: boolean;
    shulState: ShulState;
    onClose: () => void;
    onToast: (msg: string, type: "success" | "error") => void;
}) {
    const { shul, schedules, overrides, loading } = shulState;
    const [view, setView] = useState<"dashboard" | "register" | "add-schedule" | "edit-schedule" | "add-override">("dashboard");
    const [editingSchedule, setEditingSchedule] = useState<ShulSchedule | null>(null);

    // Registration form state
    const [regName, setRegName] = useState("");
    const [regAddress, setRegAddress] = useState("");
    const [regNusach, setRegNusach] = useState<"ashkenaz" | "sefard" | "edot_hamizrach" | "other">("ashkenaz");
    const [regEmail, setRegEmail] = useState("");
    const [regPhone, setRegPhone] = useState("");
    const [regWebsite, setRegWebsite] = useState("");
    const [regLat, setRegLat] = useState("");
    const [regLng, setRegLng] = useState("");
    const [regLoading, setRegLoading] = useState(false);

    // Schedule form state
    const [schedTefillah, setSchedTefillah] = useState<"SHACHARIS" | "MINCHA" | "MAARIV">("SHACHARIS");
    const [schedDays, setSchedDays] = useState<DayKey[]>(["mon", "tue", "wed", "thu", "fri"]);
    const [schedTime, setSchedTime] = useState("7:00 AM");
    const [schedName, setSchedName] = useState("");
    const [schedNotes, setSchedNotes] = useState("");
    const [schedLoading, setSchedLoading] = useState(false);

    // Override form state
    const [overDate, setOverDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [overType, setOverType] = useState<"time_change" | "cancelled" | "added">("time_change");
    const [overScheduleId, setOverScheduleId] = useState<string>("");
    const [overNewTime, setOverNewTime] = useState("");
    const [overTefillah, setOverTefillah] = useState<"SHACHARIS" | "MINCHA" | "MAARIV">("SHACHARIS");
    const [overReason, setOverReason] = useState("");
    const [overLoading, setOverLoading] = useState(false);

    const toggleDay = useCallback((day: DayKey) => {
        setSchedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    }, []);

    const handleRegister = useCallback(async () => {
        if (!regName.trim() || !regAddress.trim()) {
            onToast("Name and address are required", "error");
            return;
        }
        const lat = parseFloat(regLat);
        const lng = parseFloat(regLng);
        if (isNaN(lat) || isNaN(lng)) {
            onToast("Please enter valid coordinates", "error");
            return;
        }

        setRegLoading(true);
        const { error } = await shulState.register(
            {
                name: regName.trim(),
                address: regAddress.trim(),
                lat,
                lng,
                nusach: regNusach,
                contact_email: regEmail.trim() || undefined,
                contact_phone: regPhone.trim() || undefined,
                website: regWebsite.trim() || undefined,
            },
            []
        );
        setRegLoading(false);

        if (error) {
            onToast(error, "error");
        } else {
            onToast("Shul registered successfully!", "success");
            setView("dashboard");
        }
    }, [regName, regAddress, regLat, regLng, regNusach, regEmail, regPhone, regWebsite, shulState, onToast]);

    const handleAddSchedule = useCallback(async () => {
        if (schedDays.length === 0) {
            onToast("Select at least one day", "error");
            return;
        }
        if (!schedTime.trim()) {
            onToast("Enter a start time", "error");
            return;
        }

        setSchedLoading(true);
        const { error } = await shulState.addSchedule({
            tefillah: schedTefillah,
            days: schedDays,
            start_time: schedTime.trim(),
            name: schedName.trim() || undefined,
            notes: schedNotes.trim() || undefined,
        });
        setSchedLoading(false);

        if (error) {
            onToast(error, "error");
        } else {
            onToast("Schedule added!", "success");
            setView("dashboard");
            setSchedName("");
            setSchedNotes("");
        }
    }, [schedTefillah, schedDays, schedTime, schedName, schedNotes, shulState, onToast]);

    const handleEditSchedule = useCallback(async () => {
        if (!editingSchedule) return;

        setSchedLoading(true);
        const { error } = await shulState.editSchedule(editingSchedule.id, {
            tefillah: schedTefillah,
            days: schedDays,
            start_time: schedTime.trim(),
            name: schedName.trim() || undefined,
            notes: schedNotes.trim() || undefined,
        });
        setSchedLoading(false);

        if (error) {
            onToast(error, "error");
        } else {
            onToast("Schedule updated!", "success");
            setView("dashboard");
            setEditingSchedule(null);
        }
    }, [editingSchedule, schedTefillah, schedDays, schedTime, schedName, schedNotes, shulState, onToast]);

    const handleDeleteSchedule = useCallback(async (id: string) => {
        const { error } = await shulState.removeSchedule(id);
        if (error) onToast(error, "error");
        else onToast("Schedule deleted", "success");
    }, [shulState, onToast]);

    const handleAddOverride = useCallback(async () => {
        if (!overDate) {
            onToast("Select a date", "error");
            return;
        }

        setOverLoading(true);
        const { error } = await shulState.addOverride({
            schedule_id: overScheduleId || undefined,
            override_date: overDate,
            override_type: overType,
            new_time: overType !== "cancelled" ? overNewTime.trim() || undefined : undefined,
            tefillah: overType === "added" ? overTefillah : undefined,
            reason: overReason.trim() || undefined,
        });
        setOverLoading(false);

        if (error) {
            onToast(error, "error");
        } else {
            onToast("Override added!", "success");
            setView("dashboard");
            setOverReason("");
            setOverNewTime("");
        }
    }, [overDate, overType, overScheduleId, overNewTime, overTefillah, overReason, shulState, onToast]);

    const handleDeleteOverride = useCallback(async (id: string) => {
        const { error } = await shulState.removeOverride(id);
        if (error) onToast(error, "error");
        else onToast("Override removed", "success");
    }, [shulState, onToast]);

    const openEditSchedule = useCallback((sched: ShulSchedule) => {
        setEditingSchedule(sched);
        setSchedTefillah(sched.tefillah);
        setSchedDays([...sched.days]);
        setSchedTime(sched.start_time);
        setSchedName(sched.name ?? "");
        setSchedNotes(sched.notes ?? "");
        setView("edit-schedule");
    }, []);

    if (!open) return null;

    // ==================== Registration View ====================
    if (!shul && !loading && view !== "register") {
        return (
            <div className="settings-page">
                <header className="settings-header">
                    <button className="back-btn" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <h1 className="settings-title">My Shul</h1>
                    <div style={{ width: 36 }} />
                </header>
                <div className="settings-content">
                    <div className="shul-empty-state">
                        <div className="shul-empty-icon">🏛️</div>
                        <h2>Register Your Shul</h2>
                        <p>If you are a gabbai or shul administrator, register your shul to manage minyan times and let people find your minyanim.</p>
                        <button className="btn btn-primary" onClick={() => setView("register")}>
                            Register My Shul
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === "register") {
        return (
            <div className="settings-page">
                <header className="settings-header">
                    <button className="back-btn" onClick={() => shul ? setView("dashboard") : onClose()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <h1 className="settings-title">Register Shul</h1>
                    <div style={{ width: 36 }} />
                </header>
                <div className="settings-content">
                    <section className="settings-section">
                        <h2 className="settings-section-title">Shul Information</h2>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Shul Name *</label>
                            <input
                                className="shul-form-input"
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                placeholder="e.g., Young Israel of Forest Hills"
                            />
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Address *</label>
                            <input
                                className="shul-form-input"
                                value={regAddress}
                                onChange={(e) => setRegAddress(e.target.value)}
                                placeholder="e.g., 123 Main St, Forest Hills, NY"
                            />
                        </div>

                        <div className="shul-form-row">
                            <div className="shul-form-field">
                                <label className="shul-form-label">Latitude *</label>
                                <input
                                    className="shul-form-input"
                                    type="number"
                                    step="any"
                                    value={regLat}
                                    onChange={(e) => setRegLat(e.target.value)}
                                    placeholder="40.7200"
                                />
                            </div>
                            <div className="shul-form-field">
                                <label className="shul-form-label">Longitude *</label>
                                <input
                                    className="shul-form-input"
                                    type="number"
                                    step="any"
                                    value={regLng}
                                    onChange={(e) => setRegLng(e.target.value)}
                                    placeholder="-73.8450"
                                />
                            </div>
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Nusach</label>
                            <div className="settings-pills">
                                {NUSACH_OPTIONS.map((n) => (
                                    <button
                                        key={n.key}
                                        className={`settings-pill${regNusach === n.key ? " active" : ""}`}
                                        onClick={() => setRegNusach(n.key)}
                                    >
                                        {n.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h2 className="settings-section-title">Contact (Optional)</h2>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Email</label>
                            <input
                                className="shul-form-input"
                                type="email"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                placeholder="gabbai@shul.org"
                            />
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Phone</label>
                            <input
                                className="shul-form-input"
                                type="tel"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                                placeholder="(718) 555-1234"
                            />
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Website</label>
                            <input
                                className="shul-form-input"
                                type="url"
                                value={regWebsite}
                                onChange={(e) => setRegWebsite(e.target.value)}
                                placeholder="https://www.myshul.org"
                            />
                        </div>
                    </section>

                    <section className="settings-section">
                        <button
                            className="btn btn-primary btn-block"
                            onClick={handleRegister}
                            disabled={regLoading}
                        >
                            {regLoading ? "Registering..." : "Register Shul"}
                        </button>
                        <p className="shul-form-hint">You can add minyan schedules after registration.</p>
                    </section>
                </div>
            </div>
        );
    }

    // ==================== Add/Edit Schedule View ====================
    if (view === "add-schedule" || view === "edit-schedule") {
        const isEdit = view === "edit-schedule";
        return (
            <div className="settings-page">
                <header className="settings-header">
                    <button className="back-btn" onClick={() => { setView("dashboard"); setEditingSchedule(null); }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <h1 className="settings-title">{isEdit ? "Edit Schedule" : "Add Schedule"}</h1>
                    <div style={{ width: 36 }} />
                </header>
                <div className="settings-content">
                    <section className="settings-section">
                        <div className="shul-form-field">
                            <label className="shul-form-label">Tefillah</label>
                            <div className="settings-pills">
                                {TEFILLAH_OPTIONS.map((t) => (
                                    <button
                                        key={t.key}
                                        className={`settings-pill${schedTefillah === t.key ? " active" : ""}`}
                                        onClick={() => setSchedTefillah(t.key)}
                                    >
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Days</label>
                            <div className="shul-day-grid">
                                {DAY_OPTIONS.map((d) => (
                                    <button
                                        key={d.key}
                                        className={`shul-day-btn${schedDays.includes(d.key) ? " active" : ""}`}
                                        onClick={() => toggleDay(d.key)}
                                    >
                                        {d.short}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Start Time</label>
                            <input
                                className="shul-form-input"
                                value={schedTime}
                                onChange={(e) => setSchedTime(e.target.value)}
                                placeholder="7:00 AM"
                            />
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Name (Optional)</label>
                            <input
                                className="shul-form-input"
                                value={schedName}
                                onChange={(e) => setSchedName(e.target.value)}
                                placeholder="e.g., Vasikin, Main Minyan"
                            />
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Notes (Optional)</label>
                            <input
                                className="shul-form-input"
                                value={schedNotes}
                                onChange={(e) => setSchedNotes(e.target.value)}
                                placeholder="e.g., Followed by learning"
                            />
                        </div>
                    </section>

                    <section className="settings-section">
                        <button
                            className="btn btn-primary btn-block"
                            onClick={isEdit ? handleEditSchedule : handleAddSchedule}
                            disabled={schedLoading}
                        >
                            {schedLoading ? "Saving..." : isEdit ? "Save Changes" : "Add Schedule"}
                        </button>
                    </section>
                </div>
            </div>
        );
    }

    // ==================== Add Override View ====================
    if (view === "add-override") {
        return (
            <div className="settings-page">
                <header className="settings-header">
                    <button className="back-btn" onClick={() => setView("dashboard")}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <h1 className="settings-title">Special Day Override</h1>
                    <div style={{ width: 36 }} />
                </header>
                <div className="settings-content">
                    <section className="settings-section">
                        <div className="shul-form-field">
                            <label className="shul-form-label">Date</label>
                            <input
                                className="shul-form-input"
                                type="date"
                                value={overDate}
                                onChange={(e) => setOverDate(e.target.value)}
                            />
                        </div>

                        <div className="shul-form-field">
                            <label className="shul-form-label">Override Type</label>
                            <div className="settings-pills">
                                <button className={`settings-pill${overType === "time_change" ? " active" : ""}`} onClick={() => setOverType("time_change")}>
                                    Time Change
                                </button>
                                <button className={`settings-pill${overType === "cancelled" ? " active" : ""}`} onClick={() => setOverType("cancelled")}>
                                    Cancelled
                                </button>
                                <button className={`settings-pill${overType === "added" ? " active" : ""}`} onClick={() => setOverType("added")}>
                                    Add Minyan
                                </button>
                            </div>
                        </div>

                        {overType !== "added" && schedules.length > 0 && (
                            <div className="shul-form-field">
                                <label className="shul-form-label">Which Minyan?</label>
                                <select
                                    className="settings-select shul-form-select"
                                    value={overScheduleId}
                                    onChange={(e) => setOverScheduleId(e.target.value)}
                                >
                                    <option value="">All minyanim</option>
                                    {schedules.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {TEFILLAH_OPTIONS.find((t) => t.key === s.tefillah)?.label} — {s.start_time}
                                            {s.name ? ` (${s.name})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {overType !== "cancelled" && (
                            <div className="shul-form-field">
                                <label className="shul-form-label">New Time</label>
                                <input
                                    className="shul-form-input"
                                    value={overNewTime}
                                    onChange={(e) => setOverNewTime(e.target.value)}
                                    placeholder="6:30 AM"
                                />
                            </div>
                        )}

                        {overType === "added" && (
                            <div className="shul-form-field">
                                <label className="shul-form-label">Tefillah</label>
                                <div className="settings-pills">
                                    {TEFILLAH_OPTIONS.map((t) => (
                                        <button
                                            key={t.key}
                                            className={`settings-pill${overTefillah === t.key ? " active" : ""}`}
                                            onClick={() => setOverTefillah(t.key)}
                                        >
                                            {t.icon} {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="shul-form-field">
                            <label className="shul-form-label">Reason</label>
                            <input
                                className="shul-form-input"
                                value={overReason}
                                onChange={(e) => setOverReason(e.target.value)}
                                placeholder="e.g., Rosh Chodesh, Taanit Esther"
                            />
                        </div>
                    </section>

                    <section className="settings-section">
                        <button
                            className="btn btn-primary btn-block"
                            onClick={handleAddOverride}
                            disabled={overLoading}
                        >
                            {overLoading ? "Saving..." : "Add Override"}
                        </button>
                    </section>
                </div>
            </div>
        );
    }

    // ==================== Dashboard View ====================
    if (loading) {
        return (
            <div className="settings-page">
                <header className="settings-header">
                    <button className="back-btn" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <h1 className="settings-title">My Shul</h1>
                    <div style={{ width: 36 }} />
                </header>
                <div className="settings-content">
                    <div className="shul-loading">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <header className="settings-header">
                <button className="back-btn" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <h1 className="settings-title">My Shul</h1>
                <div style={{ width: 36 }} />
            </header>

            <div className="settings-content">
                {/* Shul Info */}
                <section className="settings-section">
                    <h2 className="settings-section-title">
                        🏛️ {shul?.name}
                        {shul?.verified && <span className="shul-verified-badge">✅ Verified</span>}
                    </h2>
                    <div className="shul-info-details">
                        <p className="shul-info-address">{shul?.address}</p>
                        {shul?.nusach && (
                            <p className="shul-info-nusach">
                                Nusach: {NUSACH_OPTIONS.find((n) => n.key === shul.nusach)?.label}
                            </p>
                        )}
                        {shul?.contact_email && <p className="shul-info-contact">📧 {shul.contact_email}</p>}
                        {shul?.contact_phone && <p className="shul-info-contact">📞 {shul.contact_phone}</p>}
                        {shul?.website && <p className="shul-info-contact">🌐 {shul.website}</p>}
                    </div>
                </section>

                {/* Weekly Schedule */}
                <section className="settings-section">
                    <div className="shul-section-header">
                        <h2 className="settings-section-title">Weekly Schedule</h2>
                        <button
                            className="shul-add-btn"
                            onClick={() => {
                                setSchedTefillah("SHACHARIS");
                                setSchedDays(["mon", "tue", "wed", "thu", "fri"]);
                                setSchedTime("7:00 AM");
                                setSchedName("");
                                setSchedNotes("");
                                setView("add-schedule");
                            }}
                        >
                            + Add
                        </button>
                    </div>

                    {schedules.length === 0 ? (
                        <div className="shul-empty-section">
                            <p>No schedules yet. Add your first minyan!</p>
                        </div>
                    ) : (
                        <div className="shul-schedule-list">
                            {TEFILLAH_OPTIONS.map((tef) => {
                                const group = schedules.filter((s) => s.tefillah === tef.key);
                                if (group.length === 0) return null;
                                return (
                                    <div key={tef.key} className="shul-schedule-group">
                                        <h3 className="shul-schedule-group-title">{tef.icon} {tef.label}</h3>
                                        {group.map((sched) => (
                                            <div key={sched.id} className="shul-schedule-item">
                                                <div className="shul-schedule-info">
                                                    <span className="shul-schedule-days">{formatDays(sched.days)}</span>
                                                    <span className="shul-schedule-time">{sched.start_time}</span>
                                                    {sched.name && <span className="shul-schedule-name">{sched.name}</span>}
                                                </div>
                                                <div className="shul-schedule-actions">
                                                    <button className="shul-action-btn" onClick={() => openEditSchedule(sched)} title="Edit">
                                                        ✏️
                                                    </button>
                                                    <button className="shul-action-btn shul-action-delete" onClick={() => handleDeleteSchedule(sched.id)} title="Delete">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Upcoming Overrides */}
                <section className="settings-section">
                    <div className="shul-section-header">
                        <h2 className="settings-section-title">Upcoming Overrides</h2>
                        <button className="shul-add-btn" onClick={() => setView("add-override")}>
                            + Add
                        </button>
                    </div>

                    {overrides.length === 0 ? (
                        <div className="shul-empty-section">
                            <p>No upcoming overrides. Add one for Rosh Chodesh, Yom Tov, etc.</p>
                        </div>
                    ) : (
                        <div className="shul-override-list">
                            {overrides.map((ov) => {
                                const relatedSched = schedules.find((s) => s.id === ov.schedule_id);
                                return (
                                    <div key={ov.id} className="shul-override-item">
                                        <div className="shul-override-info">
                                            <span className="shul-override-date">
                                                {new Date(ov.override_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                            {ov.reason && <span className="shul-override-reason">{ov.reason}</span>}
                                            <span className="shul-override-detail">
                                                {ov.override_type === "cancelled" && "❌ Cancelled"}
                                                {ov.override_type === "time_change" && `⏰ → ${ov.new_time}`}
                                                {ov.override_type === "added" && `➕ ${TEFILLAH_OPTIONS.find((t) => t.key === ov.tefillah)?.label ?? ""} at ${ov.new_time}`}
                                                {relatedSched && ` (${TEFILLAH_OPTIONS.find((t) => t.key === relatedSched.tefillah)?.label} ${relatedSched.start_time})`}
                                            </span>
                                        </div>
                                        <button className="shul-action-btn shul-action-delete" onClick={() => handleDeleteOverride(ov.id)} title="Remove">
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
