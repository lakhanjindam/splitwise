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
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    if (group?.members) {
      group.members.forEach(member => {
        owes[member.id] = {};
        owed[member.id] = {};
        netBalance[member.id] = 0;
      });
    }

    // If no expenses, just return initialized empty balances
    if (!expenses || expenses.length === 0) {
      setBalanceSummary({ owes, owed, netBalance });
      return;
    }

    // Process each expense
    expenses.forEach(expense => {
      const payerId = expense.payer_id;
      const totalParticipants = expense.splits.length;
      
      if (totalParticipants > 0) {
        // Calculate share per participant
        const sharePerPerson = expense.amount / totalParticipants;

        expense.splits.forEach(split => {
          const userId = split.user_id;

          // Skip if this split is already settled
          if (split.is_settled) {
            return;
          }

          if (userId === payerId) {
            // If payer is part of split, they're only responsible for their share
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

        // Calculate how much the payer is owed, excluding settled splits
        const unsettledSplits = expense.splits.filter(split => !split.is_settled && split.user_id !== payerId);
        const totalOwed = unsettledSplits.length * sharePerPerson;
        
        // Update payer's net balance with only unsettled amounts
        if (totalOwed > 0) {
          netBalance[payerId] = (netBalance[payerId] || 0) + totalOwed;
        }
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
      await api.deleteGroup(parseInt(params.groupId));
      setIsDeleteGroupConfirmOpen(false);
      toast.success('Group deleted successfully');
      // Use Next.js router to navigate to the frontend dashboard
      router.push('/dashboard');
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

  const handleSettleExpense = async (expenseId: number) => {
    try {
      await api.settleExpense(expenseId);
      toast.success('Expense settled successfully');
      // Refresh group details to update balances
      await fetchGroupDetails();
    } catch (error: any) {
      console.error('Error settling expense:', error);
      toast.error(error?.response?.data?.message || 'Failed to settle expense');
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
    <div className="container mx-auto p-2 sm:p-4">
      <header className="px-2 sm:px-4 lg:px-6 h-14 flex items-center justify-between relative z-10 mb-4 sm:mb-8">
        <Link className="flex items-center justify-center" href="/">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className={`ml-2 text-xl sm:text-2xl font-bold ${gradientClass} text-transparent bg-clip-text`}>
            SplitEase
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle className="relative z-20" />
          <UserNav />
        </nav>
      </header>

      {/* Group Details */}
      <div className="grid gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
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
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{group.name}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button 
              onClick={() => router.push(`/groups/${params.groupId}/expenses/create`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 px-3 sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Expense</span>
            </Button>
            {currentUser && group?.created_by?.id === currentUser.id && (
              <Dialog open={isDeleteGroupConfirmOpen} onOpenChange={setIsDeleteGroupConfirmOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex-1 sm:flex-none h-9">
                    <span className="hidden sm:inline">Delete Group</span>
                    <span className="sm:hidden">Delete</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-md mx-auto">
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
            {expenses.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No expenses yet. Create an expense to see balances.
              </div>
            ) : (
              <div className="space-y-4">
                {group?.members.map((member) => {
                  const netBalance = balanceSummary.netBalance[member.id] || 0;
                  const owes = balanceSummary.owes[member.id] || {};
                  const owed = balanceSummary.owed[member.id] || {};
                  const hasTransactions = Object.values(owes).some(amount => amount > 0) || 
                                        Object.values(owed).some(amount => amount > 0);

                  return (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.username}</span>
                        </div>
                        {hasTransactions ? (
                          <div className={`font-semibold ${
                            netBalance > 0 ? 'text-green-600 dark:text-green-500' : 
                            netBalance < 0 ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'
                          }`}>
                            {netBalance === 0 ? 'Settled up' : formatCurrency(netBalance, group.currency)}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm">No transactions</div>
                        )}
                      </div>
                      
                      {/* Show detailed breakdown only if there are transactions */}
                      {hasTransactions && (
                        <div className="mt-2 text-sm space-y-1">
                          {Object.entries(owes).map(([userId, amount]) => {
                            const user = group.members.find(m => m.id === parseInt(userId));
                            return amount > 0 && (
                              <div key={userId} className="text-red-600 dark:text-red-500">
                                Owes {user?.username}: {formatCurrency(amount, group.currency)}
                              </div>
                            );
                          })}
                          {Object.entries(owed).map(([userId, amount]) => {
                            const user = group.members.find(m => m.id === parseInt(userId));
                            return amount > 0 && (
                              <div key={userId} className="text-green-600 dark:text-green-500">
                                Owed by {user?.username}: {formatCurrency(amount, group.currency)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Expenses</CardTitle>
              <Button 
                onClick={() => {
                  if (group?.members.length === 1) {
                    toast.error('Cannot create an expense', {
                      description: 'You need at least one other member in the group to create an expense.',
                      action: {
                        label: 'Add Members',
                        onClick: () => router.push(`/groups/${params.groupId}/members`)
                      }
                    });
                    return;
                  }
                  router.push(`/groups/${params.groupId}/expenses/create`);
                }}
                className="flex items-center gap-2 h-9 px-3 sm:px-4"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Expense</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.map((expense) => {
                const payer = group?.members.find(m => m.id === expense.payer_id);
                const isPayer = expense.payer_id === currentUser?.id;
                const userSplit = expense.splits.find(split => split.user_id === currentUser?.id);
                const canSettle = !isPayer && userSplit && !userSplit.is_settled;
                
                return (
                  <div key={expense.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{expense.description}</h3>
                        <p className="text-sm text-gray-600">
                          Paid by {payer?.username} • {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold">
                          {formatCurrency(expense.amount, group?.currency || 'USD')}
                        </div>
                        {canSettle && (
                          <Button
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                            size="sm"
                            onClick={() => handleSettleExpense(expense.id)}
                          >
                            Settle
                          </Button>
                        )}
                        {isPayer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm space-y-1">
                      {expense.splits.map((split) => {
                        const user = group?.members.find(m => m.id === split.user_id);
                        return (
                          <div key={split.id} className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              {user?.username}
                              {split.is_settled && (
                                <Badge 
                                  variant="secondary"
                                  className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                >
                                  Settled
                                </Badge>
                              )}
                            </span>
                            <span>{formatCurrency(expense.amount / expense.splits.length, group?.currency || 'USD')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Delete Expense</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelDeleteExpense}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteExpense}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
