export type TefillahKey = "shacharis" | "mincha" | "maariv";

export type SpaceStatus = "OPEN" | "LOCKED" | "STARTED" | "CANCELLED" | "EXPIRED";

export type Profile = {
  id: string;
  full_name: string | null;
  reliability: number;
  streak: number;
};

export type SpaceRow = {
  id: string;
  tefillah: "SHACHARIS" | "MINCHA" | "MAARIV";
  start_time: string;
  lat: number;
  lng: number;
  map_x: number;
  map_y: number;
  address: string | null;
  notes: string | null;
  status: SpaceStatus;
  capacity: number;
  quorum_count: number;
  presence_rule: string | null;
  host_id: string | null;
  host?: Profile | null;
};

export type OfficialMinyan = {
  id: string;
  tefillah: TefillahKey;
  name: string;
  shulName: string;
  lat: number;
  lng: number;
  address: string;
  reliability: number;
  members: number;
  startTime: string;
};

export type UiBase = {
  id: string;
  type: "space" | "set";
  tefillah: TefillahKey;
  startTime: string;
  startMinutes: number;
  lat: number;
  lng: number;
  address: string;
  distanceMiles: number;
  distanceLabel: string;
  etaLabel: string;
  members: number;
  capacity: number;
};

export type UiSpace = UiBase & {
  type: "space";
  hostName: string;
  notes?: string;
  joined?: boolean;
};

export type UiSet = UiBase & {
  type: "set";
  shulName: string;
  reliability?: number;
};

export type UiItem = UiSpace | UiSet;

export type Toast = {
  id: number;
  message: string;
  type: "success" | "warning" | "error" | "info";
};

export type ZmanWindow = {
  start: number;
  end: number;
};

export type SpaceDraft = {
  tefillah: TefillahKey;
  startMinutes: number;
  location: string;
  lat: number | null;
  lng: number | null;
  notes: string;
};

export type AuthMode = "signIn" | "signUp";

// Friends system types
export type FriendRequestStatus = "pending" | "accepted" | "declined";

export type FriendRequest = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: FriendRequestStatus;
  created_at: string;
  from_user?: Profile;
  to_user?: Profile;
};

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: Profile;
};

export type MinyanInvite = {
  id: string;
  space_id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  from_user?: Profile;
  space?: SpaceRow;
};

// ==================== Shul Account Types ====================

export type NusachType = "ashkenaz" | "sefard" | "edot_hamizrach" | "other";

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "shabbat";

export type Shul = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  nusach: NusachType | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

export type ShulSchedule = {
  id: string;
  shul_id: string;
  tefillah: "SHACHARIS" | "MINCHA" | "MAARIV";
  days: DayKey[];
  start_time: string;
  name: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type OverrideType = "time_change" | "cancelled" | "added";

export type ScheduleOverride = {
  id: string;
  shul_id: string;
  schedule_id: string | null;
  override_date: string;
  override_type: OverrideType;
  new_time: string | null;
  tefillah: "SHACHARIS" | "MINCHA" | "MAARIV" | null;
  reason: string | null;
  created_at: string;
};

export type ShulAdminRole = "owner" | "gabbai";

export type ShulAdmin = {
  id: string;
  user_id: string;
  shul_id: string;
  role: ShulAdminRole;
  created_at: string;
};

