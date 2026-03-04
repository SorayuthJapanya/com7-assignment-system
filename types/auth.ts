export interface IUser {
    id: string,
    username: string,
    email: string, 
    nickname: string,
    role: string,
    createdAt: Date,
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}