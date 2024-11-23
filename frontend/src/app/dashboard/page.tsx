"use client"

import { useEffect, useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@/contexts/user-context"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import type { Group, Balance } from "@/types/schema"
import { formatCurrency } from "@/lib/utils"

export default function DashboardPage() {
  const { loading: userLoading } = useUser()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [balance, setBalance] = useState<Balance>({
    totalOwed: 0,
    totalOwes: 0,
    netBalance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch groups
        const groupsResponse = await api.getGroups()
        if (groupsResponse.data.status === 'success' && groupsResponse.data.data) {
          setGroups(groupsResponse.data.data.groups || [])
        }
        
        // Fetch balance
        const balanceResponse = await api.getUserBalances()
        if (balanceResponse.data.status === 'success' && balanceResponse.data.data) {
          const balanceData = balanceResponse.data.data;
          setBalance({
            totalOwed: balanceData.total_owed || 0,
            totalOwes: balanceData.total_owes || 0,
            netBalance: balanceData.net_balance || 0
          })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch dashboard data. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (!userLoading) {
      fetchDashboardData()
    }
  }, [userLoading, toast])

  if (loading || userLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="mr-4 flex">
              <Logo className="mr-6" />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserNav />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="container grid gap-12 py-6">
            {/* Balance Overview */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Balance Overview</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <h3 className="font-semibold">Total Balance</h3>
                  <p className={`text-2xl font-bold ${balance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance.netBalance)}
                  </p>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <h3 className="font-semibold">You are owed</h3>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(balance.totalOwed)}</p>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <h3 className="font-semibold">You owe</h3>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(balance.totalOwes)}</p>
                </div>
              </div>
            </div>

            {/* Groups List */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Your Groups</h2>
                <Link href="/groups/create">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Button>
                </Link>
              </div>
              <ScrollArea className="h-[400px] rounded-lg border">
                <div className="p-4 space-y-4">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <Link 
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="rounded-lg border bg-card p-4 block hover:bg-accent transition-colors"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {group.currency}
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <div className="flex gap-2">
                              <span>{group.member_count} members</span>
                              <span>•</span>
                              <span>Created by {group.created_by.username}</span>
                            </div>
                            {group.total_expenses > 0 && (
                              <div className="font-medium text-foreground">
                                Total: {formatCurrency(group.total_expenses, group.currency)}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No groups yet. Create or join a group to get started!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
