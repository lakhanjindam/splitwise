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
import { Group } from '@/types/schema'
import { toast } from "sonner"

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
  
  const { isMounted, currentTheme } = useThemeMount();

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await getGroupDetails(params.groupId);
        setGroup(response.group);
      } catch (error) {
        setError('Failed to load group details');
        console.error('Error fetching group:', error);
        toast.error('Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [params.groupId]);

  const handleAddExpense = async () => {
    // Form validation
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to split with');
      return;
    }

    try {
      setSubmitting(true);
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
    } catch (error) {
      console.error('Error creating expense:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
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
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between relative z-10">
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

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Split with</Label>
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`member-${member.id}`}
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label 
                        htmlFor={`member-${member.id}`} 
                        className="cursor-pointer flex items-center"
                      >
                        <User className="inline-block w-4 h-4 mr-2" />
                        {member.username}
                      </Label>
                    </div>
                  ))}
                </div>
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
