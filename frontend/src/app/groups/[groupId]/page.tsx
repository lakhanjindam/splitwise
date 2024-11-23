'use client';

import { useEffect, useState } from 'react';
import { Group, Expense, User, GroupResponse } from '@/types/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { api } from "@/lib/api-client";
import { DollarSign, Plus, UserPlus } from "lucide-react";
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useThemeMount } from "@/hooks/theme-mount";
import { UserNav } from "@/components/user-nav";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { isMounted } = useThemeMount();
  const { theme } = useTheme();

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getGroup(parseInt(params.groupId));
      const data = response.data as GroupResponse;
      
      if (data.status === 'success' && data.group) {
        setGroup(data.group);
        setExpenses(data.expenses || []);
        
        // Convert balances to Record<number, number>
        const balanceMap = Object.entries(data.balances || {}).reduce((acc, [userId, amount]) => {
          acc[parseInt(userId)] = amount;
          return acc;
        }, {} as Record<number, number>);
        
        setBalances(balanceMap);
      } else {
        const errorMsg = data.message || 'Failed to load group';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error fetching group details:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load group details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [params.groupId]);

  async function fetchUsers() {
    try {
      const response = await api.getUsers();
      if (response.data.status === 'success' && response.data.data?.users) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleAddMembers = async () => {
    try {
      // Add each selected user to the group
      const addMemberPromises = selectedUsers.map(userId => 
        api.addGroupMember(parseInt(params.groupId), userId)
      );
      
      // Wait for all members to be added
      await Promise.all(addMemberPromises);
      
      // Refresh group details to show updated members
      await fetchGroupDetails();
      
      // Reset selected users and close dialog
      setSelectedUsers([]);
      setDialogOpen(false);
      
      // Show success toast
      toast.success("Members added successfully");
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error("Failed to add members. Please try again.");
    }
  };

  if (!isMounted) return null;

  const gradientClass = theme === 'dark'
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Group Info</CardTitle>
                  <CardDescription>Manage your group details and members</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        fetchUsers();
                        setDialogOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Members</DialogTitle>
                      <DialogDescription>
                        Select users to add to this group
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] mt-4">
                      <div className="space-y-4">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-4">
                            <Checkbox
                              id={user.id.toString()}
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleUserSelect(user.id)}
                            />
                            <div className="flex items-center space-x-2">
                              <Avatar>
                                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <label
                                  htmlFor={user.id.toString()}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {user.username}
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex flex-col gap-4">
                      <Button
                        onClick={handleAddMembers}
                        className="mt-4"
                        disabled={selectedUsers.length === 0}
                      >
                        Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
