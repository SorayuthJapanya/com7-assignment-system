export interface IUser {
  id: string;
  username: string;
  email: string;
  nickname: string;
  role: string;
  profileImage?: string;
  createdAt: Date;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: IUser;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  nickname: string;
}

export interface UpdateRequest {
  nickname?: string;
  email?: string;
  role?: string;
  profileImage?: string;
}

export interface UpdateResponse {
  message: string;
  data: IUser;
}
