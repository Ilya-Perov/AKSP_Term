export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Family {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
}

export interface Task {
  id: number;
  family_id: number;
  title: string;
  description?: string;
  assigned_to?: number;
  status: string;
  due_date?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: number;
  user_id: number;
  family_id: number;
  role: string;
  joined_at: string;
}

export interface FamilyDetail extends Family {
  members: FamilyMember[];
  tasks: Task[];
}
