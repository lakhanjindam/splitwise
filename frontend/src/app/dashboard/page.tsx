"use client"

import { useEffect, useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import axios from 'axios'
import Link from "next/link"
import { Plus } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@/contexts/user-context"

interface Group {
  id: number
  name: string
  memberCount: number
}

interface Balance {
  totalOwed: number
  totalOwes: number
  netBalance: number
}

export default function DashboardPage() {
  const { loading: userLoading } = useUser()
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
        const groupsResponse = await axios.get('/api/groups')
        setGroups(groupsResponse.data)
        
        // Fetch balance
        const balanceResponse = await axios.get('/api/balance')
        setBalance(balanceResponse.data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!userLoading) {
      fetchDashboardData()
    }
  }, [userLoading])

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
                  <p className="text-2xl font-bold text-green-600">${balance.netBalance.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <h3 className="font-semibold">You are owed</h3>
                  <p className="text-2xl font-bold text-green-600">${balance.totalOwed.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <h3 className="font-semibold">You owe</h3>
                  <p className="text-2xl font-bold text-red-600">${balance.totalOwes.toFixed(2)}</p>
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
              <ScrollArea className="h-[300px] rounded-lg border">
                <div className="p-4">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <Link 
                        key={group.id}
                        href={`/expense-groups/${group.id}`}
                        className="mb-4 rounded-lg border bg-card p-4 last:mb-0 block hover:bg-accent transition-colors"
                      >
                        <div className="space-y-2">
                          <h3 className="font-semibold">{group.name}</h3>
                          <div className="text-sm text-muted-foreground">
                            {group.memberCount} members
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
