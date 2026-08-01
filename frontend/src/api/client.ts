import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
});

export type Role = "guest" | "verified" | "operative" | "sysadmin";

export interface CurrentUser {
  id: string;
  alias: string;
  role: Role;
  joinedAt?: string;
  postCount?: number;
}

export interface Channel {
  _id: string;
  slug: string;
  name: string;
  description: string;
  requiredClearance: Role;
  requiredClearanceToPost: Role;
  archived: boolean;
  locked: boolean;
}

export interface EntryAuthor {
  _id: string;
  alias: string;
  role: Role;
}

export interface Reply {
  _id: string;
  author: EntryAuthor;
  body: string;
  createdAt: string;
}

export interface Entry {
  _id: string;
  channel: string;
  author?: EntryAuthor;
  title?: string;
  body?: string;
  requiredClearance: Role;
  pinned?: boolean;
  locked?: boolean;
  flagged?: boolean;
  replies?: Reply[];
  createdAt?: string;
  editedAt?: string | null;
}

/** True when the API returned a redacted placeholder rather than full content. */
export function isRedacted(entry: Entry): boolean {
  return entry.title === undefined;
}

export interface SearchResult {
  _id: string;
  title: string;
  channel: { _id: string; slug: string; name: string };
  requiredClearance: Role;
  createdAt: string;
}
