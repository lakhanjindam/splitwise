'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Plus, FileText, User } from "lucide-react"
import { ThemeToggle } from '@/components/theme-toggle'
import { useThemeMount } from "@/hooks/theme-mount"
import { createExpense } from '@/lib/api/expenses'
import { getGroupDetails } from '@/lib/api/groups'
import { api } from '@/lib/api-client'
import { Group } from '@/types/schema'
import { toast, Toaster } from "sonner"

interface CreateExpensePageProps {
  params: {
    groupId: string;
  };
}

export default function CreateExpensePage({ params }: CreateExpensePageProps) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const { isMounted, currentTheme } = useThemeMount();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupResponse, userResponse] = await Promise.all([
          getGroupDetails(params.groupId),
          api.getCurrentUser()
        ]);
        setGroup(groupResponse.group);
        if (userResponse.data.status === 'success' && userResponse.data.data?.user) {
          setCurrentUser(userResponse.data.data.user);
        }
      } catch (error) {
        setError('Failed to load required data');
        console.error('Error fetching data:', error);
        toast.error('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.groupId]);

  const validateExpense = () => {
    const errors = [];

    if (!description.trim()) {
      errors.push('Description is required');
    }

    if (!amount || parseFloat(amount) <= 0) {
      errors.push('Please enter a valid amount');
    }

    if (selectedMembers.length === 0) {
      errors.push('Select at least one member to split with');
    } else if (currentUser) {
      const otherMembers = selectedMembers.filter(id => id !== currentUser.id);
      if (otherMembers.length === 0) {
        errors.push('Include at least one other member in the split');
      }
    }

    return errors;
  };

  const handleAddExpense = async () => {
    const validationErrors = validateExpense();
    
    if (validationErrors.length > 0) {
      toast.error('Please fix the following errors:', {
        description: (
          <div className="mt-2">
            <ul className="list-disc pl-4 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 5000
      });
      return;
    }

    setSubmitting(true);
    try {
      setError(null);
      
      const response = await createExpense(params.groupId, {
        description: description.trim(),
        amount: parseFloat(amount),
        split_with: selectedMembers,
      });

      toast.success('Expense created successfully');
      
      // Navigate back to group page and refresh
      router.push(`/groups/${params.groupId}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create expense';
      setError(errorMessage);
      toast.error(errorMessage);
      setSubmitting(false);
    }
  }

  if (!isMounted) return null;

  const gradientClass = currentTheme === 'dark'
    ? 'bg-gradient-to-r from-[#FFDAB9] via-[#87CEEB] to-[#E6E6FA]'
    : 'bg-gradient-to-r from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1]'
  
  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

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
      <Toaster richColors position="top-center" />
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between relative z-10 mb-8">
        <Link className="flex items-center justify-center" href="/">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className={`ml-2 text-2xl font-bold ${gradientClass} text-transparent bg-clip-text`}>
            SplitEase
          </span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle className="relative z-20" />
        </nav>
      </header>
      
      <Card className="mb-6 max-w-md mx-auto relative overflow-hidden p-0.5 shadow-xl transition hover:bg-[length:400%_400%] hover:shadow-sm hover:[animation-duration:_4s] dark:shadow-gray-700/25">
        <div className="custom-card-gradient" />
        <div className="custom-card-inner">
          <CardHeader>
            <CardTitle>Add New Expense</CardTitle>
            <CardDescription>Group: {group.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <div className="col-span-3 relative">
                  <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="pl-9"
                    placeholder="Enter expense description"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-3 relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                    placeholder={`Enter amount (${group.currency})`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Split with</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group?.members.map((member) => (
                    <div
                      key={member.id}
                      className={`
                        flex items-center space-x-2 p-4 rounded-lg border cursor-pointer
                        ${selectedMembers.includes(member.id) ? 'border-primary bg-primary/5' : 'border-input'}
                        ${member.id === currentUser?.id ? 'opacity-50' : ''}
                        hover:bg-accent hover:text-accent-foreground
                      `}
                      onClick={() => handleMemberToggle(member.id)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {member.username}
                          {member.id === currentUser?.id && ' (You)'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {selectedMembers.includes(member.id) && (
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Select at least one other member to split the expense with.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddExpense} 
              disabled={submitting}
              className="relative"
            >
              {submitting ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="opacity-0">Create Expense</span>
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Expense
                </>
              )}
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
