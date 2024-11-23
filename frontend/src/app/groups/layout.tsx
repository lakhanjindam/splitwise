"use client"

import { UserProvider } from "@/contexts/user-context"

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <UserProvider>{children}</UserProvider>
}
