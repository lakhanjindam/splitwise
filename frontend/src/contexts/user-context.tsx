"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api-client"
import type { User } from "@/types/schema"

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// List of paths that don't require authentication
const publicPaths = ['/', '/auth/login', '/auth/register']

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let ignore = false

    const checkAuth = async () => {
      // Skip auth check for public paths
      if (publicPaths.includes(pathname)) {
        setLoading(false)
        return
      }

      try {
        const response = await api.getCurrentUser()
        if (!ignore) {
          if (response.data?.data) {
            setUser(response.data.data)
          } else {
            setUser(null)
            if (!publicPaths.includes(pathname)) {
              router.push("/auth/login")
            }
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error("Auth check failed:", error)
          setUser(null)
          if (!publicPaths.includes(pathname)) {
            router.push("/auth/login")
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      ignore = true
    }
  }, [router, pathname])

  const value = {
    user,
    setUser,
    loading
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
