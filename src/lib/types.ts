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
