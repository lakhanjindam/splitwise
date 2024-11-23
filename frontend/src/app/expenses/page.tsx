'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Plus, Trash2, FileText, User } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { ThemeToggle } from '@/components/theme-toggle'
import { useThemeMount } from "@/hooks/theme-mount"
import { createExpense } from '@/lib/api/expenses'
import { useRouter } from 'next/navigation'

interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  dateCreated: number;
  paidBy: string;
}

const currencies = [
  { label: 'USD', symbol: '$' },  // United States Dollar
  { label: 'EUR', symbol: '€' },  // Euro
  { label: 'GBP', symbol: '£' },  // British Pound Sterling
  { label: 'JPY', symbol: '¥' },  // Japanese Yen
  { label: 'AUD', symbol: 'A$' }, // Australian Dollar
  { label: 'CAD', symbol: 'C$' }, // Canadian Dollar
  { label: 'CHF', symbol: 'CHF' }, // Swiss Franc
  { label: 'CNY', symbol: '¥' },  // Chinese Yuan
  { label: 'INR', symbol: '₹' },  // Indian Rupee
  { label: 'RUB', symbol: '₽' },  // Russian Ruble
  { label: 'BRL', symbol: 'R$' }, // Brazilian Real
  { label: 'MXN', symbol: 'MX$' }, // Mexican Peso
  { label: 'ZAR', symbol: 'R' },  // South African Rand
  { label: 'KRW', symbol: '₩' },  // South Korean Won
  { label: 'SGD', symbol: 'S$' }, // Singapore Dollar
  { label: 'HKD', symbol: 'HK$' }, // Hong Kong Dollar
  { label: 'TRY', symbol: '₺' },  // Turkish Lira
  { label: 'SEK', symbol: 'kr' }, // Swedish Krona
  { label: 'NOK', symbol: 'kr' }, // Norwegian Krone
  { label: 'NZD', symbol: 'NZ$' }, // New Zealand Dollar
];

const users = [
  { label: 'Alice', value: 'alice' },
  { label: 'Bob', value: 'bob' },
  { label: 'Charlie', value: 'charlie' },
  { label: 'David', value: 'david' },
  { label: 'Eve', value: 'eve' },
]

export default function ExpensePage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [paidBy, setPaidBy] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const { isMounted, currentTheme } = useThemeMount();

  if (!isMounted) return null;

  const gradientClass = currentTheme === 'dark'
    ? 'bg-gradient-to-r from-[#FFDAB9] via-[#87CEEB] to-[#E6E6FA]'
    : 'bg-gradient-to-r from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1]'
  
  const handleAddExpense = async () => {
    if (!description || !amount || !currency || !paidBy) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // For now, we'll use a default group ID. In a real app, you'd get this from the route or props
      const groupId = '1';
      await createExpense(groupId, {
        description,
        amount: parseFloat(amount),
        split_with: [1, 2], // For now, we'll split with default users. In a real app, you'd select users
      });

      // Clear form and refresh the page
      setDescription('');
      setAmount('');
      setCurrency('USD');
      setPaidBy('');
      router.refresh();
    } catch (error) {
      console.error('Error creating expense:', error);
      setError(error instanceof Error ? error.message : 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  }

  const handleDeleteExpense = (id: number) => {
    setExpenses((prevExpenses) => prevExpenses.filter(expense => expense.id !== id))
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
            <CardDescription>Enter the details of your new expense</CardDescription>
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
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-2 relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((cur) => (
                      <SelectItem key={cur.label} value={cur.label}>
                        {cur.label} ({cur.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paidBy" className="text-right">
                  Paid By
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="col-span-3 justify-between relative"
                    >
                      <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <span className="ml-6">
                        {paidBy
                          ? users.find((user) => user.value === paidBy)?.label
                          : "Select user..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search user..." />
                      <CommandEmpty>No user found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.value}
                            onSelect={(currentValue) => {
                              setPaidBy(currentValue === paidBy ? "" : user.value)
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                paidBy === user.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {user.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleAddExpense} disabled={submitting}>
              <Plus className="mr-2 h-4 w-4" />
              {submitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </CardFooter>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className="flex flex-col justify-between relative">
            <div className="absolute top-2 right-2">
              <p className="text-xs text-muted-foreground">Added on: </p>
              <p className="text-sm font-semibold text-muted-foreground border-b border-dotted border-primary">
                {new Date(expense.dateCreated).toLocaleDateString()}
              </p>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{expense.description}</CardTitle>
              <CardDescription>
                Paid by{" "}
                <span className="font-medium border-b border-dotted border-primary">
                  {expense.paidBy}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-xl font-semibold">
                {currencies.find(cur => cur.label === expense.currency)?.symbol || ''}
                {expense.amount.toFixed(2)} {expense.currency}
              </p>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="destructive" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
