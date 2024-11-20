'use client'

import { Button } from "@/components/ui/button"
import { DollarSign, PieChart, Users } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

export function LandingPageComponent() {
  const { theme } = useTheme()

  const gradientClass = theme === 'dark'
    ? 'from-[#1a1a2e] to-[#16213e]'
    : 'from-gray-50 to-white'

  const headerGradientClass = theme === 'dark'
    ? 'from-[#FFDAB9] via-[#87CEEB] to-[#E6E6FA]'
    : 'from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1]'

  return (
    <div className={`relative flex flex-col min-h-screen text-foreground overflow-hidden
      bg-gradient-to-b ${gradientClass} transition-colors duration-500
    `}>
      <header className="relative z-10 px-4 lg:px-6 h-14 flex items-center justify-between">
        <Link className="flex items-center justify-center" href="/">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className={`ml-2 text-2xl font-bold bg-gradient-to-r ${headerGradientClass} text-transparent bg-clip-text bg-300% animate-gradient`}>
            SplitEase
          </span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 transition-all duration-200 hover:text-primary" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 transition-all duration-200 hover:text-primary" href="#about">
            About
          </Link>
          <ThemeToggle className="relative z-20" />
        </nav>
      </header>
      <main className="flex-1 relative z-10">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  <span className={`bg-gradient-to-r ${headerGradientClass} text-transparent bg-clip-text bg-300% animate-gradient`}>
                    Split Expenses with Ease
                  </span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Simplify group expenses and settle debts effortlessly. Perfect for roommates, trips, and shared
                  finances.
                </p>
              </div>
              <Link href="/expenses">
                <Button size="lg" className="transition-all duration-200 hover:scale-105">
                  Add Expense
                  <DollarSign className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Users className="h-6 w-6 text-primary-foreground" />}
                title="Group Expenses"
                description="Easily split bills among friends, roommates, or travel companions."
                gradientFrom="from-blue-500"
                gradientTo="to-cyan-300"
              />
              <FeatureCard
                icon={<DollarSign className="h-6 w-6 text-primary-foreground" />}
                title="Debt Tracking"
                description="Keep track of who owes what with our intuitive debt management system."
                gradientFrom="from-green-500"
                gradientTo="to-emerald-300"
              />
              <FeatureCard
                icon={<PieChart className="h-6 w-6 text-primary-foreground" />}
                title="Expense Analytics"
                description="Visualize your spending patterns and optimize your group finances."
                gradientFrom="from-purple-500"
                gradientTo="to-pink-300"
              />
            </div>
          </div>
        </section>
        <section id="about" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Start Splitting Today</h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                  Join thousands of users who trust SplitEase for hassle-free expense sharing.
                </p>
              </div>
              <Link href="/expenses">
                <Button
                  size="lg"
                  className="transition-all duration-300 ease-in-out">
                  Add Your First Expense
                  <DollarSign className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="relative z-10 flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2024 SplitEase. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 transition-all duration-200 hover:text-primary" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 transition-all duration-200 hover:text-primary" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

function FeatureCard({ icon, title, description, gradientFrom, gradientTo }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center space-y-4 text-center transition-all duration-200 hover:transform hover:scale-105">
      <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full p-3`}>
        {icon}
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  )
}