'use client';

import { useEffect, useState } from 'react';
import { Group, Expense, Balance } from '@/types/schema';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { getGroupDetails } from '@/lib/api/groups';
import { DollarSign, Plus } from "lucide-react";
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useThemeMount } from "@/hooks/theme-mount";
import { UserNav } from "@/components/user-nav";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GroupDetailsProps {
  params: {
    groupId: string;
  };
}

export default function GroupDetailsPage({ params }: GroupDetailsProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isMounted, currentTheme } = useThemeMount();

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getGroupDetails(params.groupId);
        setGroup(response.group);
        setExpenses(response.expenses);
        setBalances(response.balances);
      } catch (error) {
        console.error('Error fetching group details:', error);
        setError('Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [params.groupId]);

  if (!isMounted) return null;

  const gradientClass = currentTheme === 'dark'
    ? 'bg-gradient-to-r from-[#FFDAB9] via-[#87CEEB] to-[#E6E6FA]'
    : 'bg-gradient-to-r from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1]';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold mb-4">Group not found</h2>
        <Button onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between relative z-10 mb-8">
        <Link className="flex items-center justify-center" href="/">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className={`ml-2 text-2xl font-bold ${gradientClass} text-transparent bg-clip-text`}>
            SplitEase
          </span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle className="relative z-20" />
          <UserNav />
        </nav>
      </header>

      {/* Group Details */}
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <Button 
            onClick={() => router.push(`/groups/${params.groupId}/expenses/create`)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {/* Group Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-semibold">Group Info</h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Members</h3>
                <div className="flex flex-wrap gap-4">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{member.username}</span>
                      <span className={balances[member.id] > 0 ? 'text-green-500' : balances[member.id] < 0 ? 'text-red-500' : ''}>
                        {formatCurrency(balances[member.id] || 0, group.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Recent Expenses</h2>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-center text-gray-500">No expenses yet</p>
            ) : (
              <div className="grid gap-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{expense.description}</h3>
                      <p className="text-sm text-gray-500">
                        Paid by {expense.payer?.username} • {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(expense.amount, group.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
