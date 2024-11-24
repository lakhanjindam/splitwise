'use client';

import { useEffect, useState, useCallback } from 'react';
import { Group, Expense, User, GroupResponse, ApiResponse } from '@/types/schema';
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
  // const [balances, setBalances] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [balanceSummary, setBalanceSummary] = useState<{
    owes: Record<number, Record<number, number>>;
    owed: Record<number, Record<number, number>>;
    netBalance: Record<number, number>;
  }>({
    owes: {},
    owed: {},
    netBalance: {}
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDeleteGroupConfirmOpen, setIsDeleteGroupConfirmOpen] = useState(false);
  const router = useRouter();
  const { isMounted } = useThemeMount();
  const { theme } = useTheme();

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const groupResponse = await api.getGroup(parseInt(params.groupId));
      const groupData = groupResponse.data as GroupResponse;
      
      if (groupData.status === 'success' && groupData.group) {
        setGroup(groupData.group);
        setExpenses(groupData.expenses || []);
        calculateBalances(groupData.expenses || []);
        
        // No need to fetch expenses separately as they're included in group response
      } else {
        console.error('Failed to fetch group:', groupData.message);
        setError(groupData.message || 'Failed to load group details');
      }
    } catch (error: any) {
      console.error('Error fetching group details:', error);
      setError(error?.response?.data?.message || 'Failed to load group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
    fetchCurrentUser();
  }, [params.groupId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.data.status === 'success' && response.data.data?.user) {
        setCurrentUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.data.status === 'success' && response.data.data?.users) {
        // Filter out users who are already members of the group
        const groupMemberIds = group?.members.map((member: User) => member.id) || [];
        const availableUsers = response.data.data.users.filter((user: User) => !groupMemberIds.includes(user.id));
        setUsers(availableUsers);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    if (group) {
      fetchUsers();
    }
  }, [group]);

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
      const groupId = parseInt(params.groupId);
      
      // Get current group members and add new selected users
      const currentMemberIds = group?.members.map(member => member.id) || [];
      const updatedMemberIds = Array.from(new Set([...currentMemberIds, ...selectedUsers]));
      
      // Update group members
      await api.updateGroupMembers(groupId, updatedMemberIds);
      
      // Reset selected users and close dialog
      setSelectedUsers([]);
      setDialogOpen(false);
      
      // Show success toast
      toast.success("Members added successfully");

      // Fetch updated group details
      await fetchGroupDetails();
      
      // Then fetch available users
      await fetchUsers();
    } catch (error: any) {
      console.error('Error adding members:', error);
      toast.error(error.response?.data?.message || "Failed to add members. Please try again.");
    }
  };

  const calculateBalances = (expenses: Expense[]) => {
    // Reset all balance tracking
    const owes: Record<number, Record<number, number>> = {};
    const owed: Record<number, Record<number, number>> = {};
    const netBalance: Record<number, number> = {};

    // Initialize balances for all group members
    group?.members.forEach(member => {
      owes[member.id] = {};
      owed[member.id] = {};
      netBalance[member.id] = 0;
    });

    // Process each expense
    expenses.forEach(expense => {
      const payerId = expense.payer_id;
      const totalParticipants = expense.splits.length;
      const isPayerIncluded = expense.splits.some(split => split.user_id === payerId);
      
      if (totalParticipants > 0) {
        // Calculate share per participant
        const sharePerPerson = expense.amount / totalParticipants;

        expense.splits.forEach(split => {
          const userId = split.user_id;

          if (userId === payerId) {
            // If payer is part of split, they're only responsible for their share
            // Other participants will owe the remaining amount
            netBalance[payerId] = (netBalance[payerId] || 0) - sharePerPerson;
          } else {
            // Non-paying participants owe their share to the payer
            owes[userId] = owes[userId] || {};
            owes[userId][payerId] = (owes[userId][payerId] || 0) + sharePerPerson;

            owed[payerId] = owed[payerId] || {};
            owed[payerId][userId] = (owed[payerId][userId] || 0) + sharePerPerson;

            // Update net balances
            netBalance[userId] = (netBalance[userId] || 0) - sharePerPerson;
          }
        });

        // Add the total amount payer is owed (total expense minus their share if included)
        const payerOwedAmount = isPayerIncluded 
          ? expense.amount - sharePerPerson  // If payer is included, they're owed total minus their share
          : expense.amount;                  // If payer is not included, they're owed the full amount
        
        netBalance[payerId] = (netBalance[payerId] || 0) + payerOwedAmount;
      }
    });

    setBalanceSummary({ owes, owed, netBalance });
  };

  const shouldShowBalance = (memberId: number, balanceAmount: number) => {
    return balanceAmount !== 0;
  };

  useEffect(() => {
    if (expenses.length > 0 && group) {
      calculateBalances(expenses);
    }
  }, [expenses, group]);

  const handleDeleteExpense = useCallback((expenseId: number) => {
    setExpenseToDelete(expenseId);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteGroup = async () => {
    try {
      const response = await api.deleteGroup(parseInt(params.groupId));
      if (response.data.status === 'success') {
        setIsDeleteGroupConfirmOpen(false);
        toast.success(response.data.message || 'Group deleted successfully');
        router.replace('/dashboard'); // Use replace instead of push
      } else {
        toast.error(response.data.message || 'Failed to delete group');
        setIsDeleteGroupConfirmOpen(false);
      }
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete group');
      setIsDeleteGroupConfirmOpen(false);
    }
  };

  const confirmDeleteExpense = useCallback(async () => {
    try {
      if (!expenseToDelete) {
        toast.error("Invalid expense ID");
        return;
      }

      // Delete the expense
      await api.deleteExpense(expenseToDelete);
      
      // Refresh group details
      await fetchGroupDetails();
      
      toast.success("Expense deleted successfully");
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error(error?.response?.data?.message || "Failed to delete the expense. Please try again.");
    } finally {
      setIsDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    }
  }, [expenseToDelete, fetchGroupDetails]);

  const cancelDeleteExpense = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setExpenseToDelete(null);
  }, []);

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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
              size="sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back
            </Button>
            <h1 className="text-3xl font-bold">{group.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push(`/groups/${params.groupId}/expenses/create`)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
            {currentUser && group?.created_by?.id === currentUser.id && (
              <Dialog open={isDeleteGroupConfirmOpen} onOpenChange={setIsDeleteGroupConfirmOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete Group</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Group</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this group? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-4 mt-4">
                    <Button variant="outline" onClick={() => setIsDeleteGroupConfirmOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteGroup}>Delete</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
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
                    {users.length > 0 ? (
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
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="rounded-full bg-secondary p-3 mb-4">
                          <UserPlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">No Users Available</h3>
                        <p className="text-sm text-muted-foreground">
                          All users have been added to this group.
                        </p>
                      </div>
                    )}
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
                      <div className="flex items-center gap-2">
                        <span>{member.username}</span>
                        {group.created_by?.id === member.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Admin</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Summary Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Balance Summary</CardTitle>
            <CardDescription>See who owes what in the group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {group?.members.map((member) => (
                <div key={member.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.username}</span>
                    </div>
                    {shouldShowBalance(member.id, balanceSummary.netBalance[member.id]) && (
                      <div className={`font-semibold ${
                        balanceSummary.netBalance[member.id] > 0 ? 'text-green-600' : balanceSummary.netBalance[member.id] < 0 ? 'text-red-600' : ''
                      }`}>
                        {formatCurrency(balanceSummary.netBalance[member.id], group.currency)}
                      </div>
                    )}
                  </div>
                  
                  {/* Show detailed breakdown */}
                  <div className="mt-2 text-sm space-y-1">
                    {Object.entries(balanceSummary.owes[member.id] || {}).map(([userId, amount]) => {
                      const user = group.members.find(m => m.id === parseInt(userId));
                      return amount > 0 && (
                        <div key={userId} className="text-red-600">
                          Owes {user?.username}: {formatCurrency(amount, group.currency)}
                        </div>
                      );
                    })}
                    {Object.entries(balanceSummary.owed[member.id] || {}).map(([userId, amount]) => {
                      const user = group.members.find(m => m.id === parseInt(userId));
                      return amount > 0 && (
                        <div key={userId} className="text-green-600">
                          Owed by {user?.username}: {formatCurrency(amount, group.currency)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
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
                {expenses.map((expense) => {
                  const payer = group?.members.find(m => m.id === expense.payer_id);
                  
                  // Get all split members including payer
                  const allSplitMembers = expense.splits.map(split => {
                    const member = group?.members.find(m => m.id === split.user_id);
                    const isPayer = split.user_id === expense.payer_id;
                    return {
                      name: member?.username || 'Unknown',
                      amount: split.amount,
                      isPayer
                    };
                  });

                  return (
                    <div key={expense.id} className="flex flex-col space-y-2 p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <h3 className="font-medium">{expense.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            Paid by {payer?.username || 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Split between:</p>
                            <div className="flex flex-wrap gap-2">
                              {allSplitMembers.map((member, idx) => (
                                <div
                                  key={idx}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm 
                                    ${member.isPayer ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary'}`}
                                >
                                  <span className="font-medium">
                                    {member.name}
                                    {member.isPayer && " (Paid)"}
                                  </span>
                                  <span className={`${member.isPayer ? 'text-primary/70' : 'text-muted-foreground'}`}>
                                    ({group?.currency} {member.amount.toFixed(2)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4">
                          <p className="text-lg font-semibold">
                            {group?.currency} {expense.amount.toFixed(2)}
                          </p>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {expenses.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No expenses yet. Add one to get started!
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Delete Expense</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDeleteExpense}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExpense}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
