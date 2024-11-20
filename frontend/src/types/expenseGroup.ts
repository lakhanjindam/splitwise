export interface ExpenseGroup {
  id: number;
  name: string;
  members: string[]; // Array of user IDs or names
  expenses: Expense[]; // Array of expenses related to this group
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  dateCreated: number;
  paidBy: string;
}
