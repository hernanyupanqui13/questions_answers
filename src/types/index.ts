// Shared TypeScript types used across the application

export type QuestionStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

export interface RoomInfo {
  id: string;
  roomId: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface QuestionWithVotes {
  id: string;
  content: string;
  status: QuestionStatus;
  createdAt: string;
  voteCount: number;
  userVoted: boolean; // derived from browser token
}

export interface VoteResult {
  questionId: string;
  voteCount: number;
  userVoted: boolean;
}

// Socket.IO event payloads

export interface JoinRoomPayload {
  roomId: string;
  browserToken: string;
  adminToken?: string;
}

export interface SubmitQuestionPayload {
  roomId: string;
  content: string;
  browserToken: string;
}

export interface VotePayload {
  questionId: string;
  browserToken: string;
}

export interface ModeratePayload {
  questionId: string;
  action: "approve" | "reject" | "archive";
  adminToken: string;
}

export interface UpdateRoomPayload {
  roomId: string;
  title: string;
  description: string;
  adminToken: string;
}

// Events emitted from server to client
export interface ServerToClientEvents {
  "question:new": (question: QuestionWithVotes) => void;
  "question:approved": (question: QuestionWithVotes) => void;
  "question:rejected": (questionId: string) => void;
  "question:archived": (questionId: string) => void;
  "question:vote_update": (data: { questionId: string; voteCount: number }) => void;
  "room:updated": (data: { title: string; description: string | null }) => void;
  error: (message: string) => void;
}

// Events emitted from client to server
export interface ClientToServerEvents {
  "room:join": (payload: JoinRoomPayload) => void;
  "question:submit": (payload: SubmitQuestionPayload) => void;
  "question:vote": (payload: VotePayload) => void;
  "question:moderate": (payload: ModeratePayload) => void;
  "room:update": (payload: UpdateRoomPayload) => void;
}
