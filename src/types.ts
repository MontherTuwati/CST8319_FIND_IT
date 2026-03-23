import type { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  role: "user" | "admin";
  displayName: string;
  email: string;
  createdAt: Timestamp;
}

export interface Post {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  locationText: string;
  eventDate: string;
  status: "open" | "in_review" | "resolved" | "hidden";
  photoURL: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Claim {
  id: string;
  postId: string;
  claimantId: string;
  message: string;
  status: "pending" | "approved" | "denied";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Flag {
  id: string;
  postId: string;
  flaggedBy: string;
  reason: string;
  createdAt: Timestamp;
}
