export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  currency: string;
  created_by: {
    id: number;
    username: string;
  };
  members: {
    id: number;
    username: string;
    email: string;
  }[];
  total_expenses: number;
  member_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  group_id: number;
  payer_id: number;
  currency: string;
  payer?: User;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: number;
  expense_id: number;
  user_id: number;
  amount: number;
  is_settled: boolean;
  settled_at?: string;
  user?: User;
}

export interface Balance {
  totalOwed: number;
  totalOwes: number;
  netBalance: number;
}

export interface UserBalance {
  user_id: number;
  amount: number;
  user?: User;
}

export interface GroupBalance {
  group_id: number;
  balances: UserBalance[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: {
    user?: User;
    [key: string]: any;
  };
}

export interface CreateGroupResponse {
  id: number;
  name: string;
  members: User[];
  created_at: string;
}

export interface GroupResponse {
  status: 'success' | 'error';
  message?: string;
  group: Group;
  expenses: Expense[];
  balances: Record<string, number>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
