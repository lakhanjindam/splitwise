export interface User {
  id: number;
  username: string;
  email: string;
}

export interface GroupMember {
  id: number;
  userId: number;
  user: User;
}

export interface GroupCategory {
  value: string;
  label: string;
  icon?: string;
}

export const GROUP_CATEGORIES: GroupCategory[] = [
  { value: 'home', label: 'Home', icon: '🏠' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'trip', label: 'Trip', icon: '✈️' },
  { value: 'couple', label: 'Couple', icon: '💑' },
  { value: 'friends', label: 'Friends', icon: '👥' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
] as const;

export type Currency = typeof CURRENCIES[number]['value'];
