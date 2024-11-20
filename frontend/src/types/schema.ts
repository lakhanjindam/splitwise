export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  created_by_id: number;
  currency: string;
  members: User[];
  creator: User;
  total_expenses?: number;
  member_count?: number;
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
  user_id: number;
  amount: number;
  user?: User;
}

export interface GroupBalance {
  group_id: number;
  balances: Balance[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
