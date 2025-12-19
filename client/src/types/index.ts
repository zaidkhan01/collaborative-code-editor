export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Room {
  id: string;
  roomId: string;
  name: string;
  language: string;
  owner: User;
  code: string;
  participants: Participant[];
  createdAt: string;
}

export interface Participant {
  user: User;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
}

export interface UserCursor {
  userId: string;
  username: string;
  position: {
    lineNumber: number;
    column: number;
  };
  color: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  executionTime: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

