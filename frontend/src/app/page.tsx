'use client'

import { Button } from "@/components/ui/button"
import { DollarSign, PieChart, Users } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import React, { useState, useEffect } from 'react';
import { useThemeMount } from "@/hooks/theme-mount";

export default function LandingPage() {
  const { isMounted, currentTheme } = useThemeMount(); // Use the custom hook

  // Prevent rendering until the theme is resolved
  if (!isMounted) return null;

  const gradientClass = currentTheme === 'dark'
    ? 'from-[#1a1a2e] to-[#16213e]'
    : 'from-gray-50 to-white'

  const headerGradientClass = currentTheme === 'dark'
    ? 'bg-gradient-to-r from-[#FFDAB9] via-[#87CEEB] to-[#E6E6FA]'
    : 'bg-gradient-to-r from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1]'

  return (
    <div className={`relative flex flex-col min-h-screen text-foreground overflow-hidden
      ${gradientClass}
    `}>
      {/* <div className="absolute inset-0 z-0 pointer-events-none">
        <DotBackground />
      </div> */}
      <header className="relative z-10 px-4 lg:px-6 h-14 flex items-center justify-between">
        <Link className="flex items-center justify-center" href="/">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className={`ml-2 text-2xl font-bold ${headerGradientClass} text-transparent bg-clip-text bg-300% animate-gradient`}>
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
                  <span className={`bg-gradient-to-r ${headerGradientClass} text-transparent bg-clip-text animate-gradient`}>
                    Split Expenses with Ease
                  </span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Simplify group expenses and settle debts effortlessly. Perfect for roommates, trips, and shared
                  finances.
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="transition-all duration-200 hover:scale-105">
                    Get Started
                    <DollarSign className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="transition-all duration-200 hover:scale-105">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center transition-all duration-200 hover:transform hover:scale-105">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-300 rounded-full p-3">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold">Group Expenses</h2>
                <p className="text-muted-foreground">
                  Easily split bills among friends, roommates, or travel companions.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center transition-all duration-200 hover:transform hover:scale-105">
                <div className="bg-gradient-to-br from-green-500 to-emerald-300 rounded-full p-3">
                  <DollarSign className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold">Debt Tracking</h2>
                <p className="text-muted-foreground">
                  Keep track of who owes what with our intuitive debt management system.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center transition-all duration-200 hover:transform hover:scale-105">
                <div className="bg-gradient-to-br from-purple-500 to-pink-300 rounded-full p-3">
                  <PieChart className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold">Expense Analytics</h2>
                <p className="text-muted-foreground">
                  Visualize your spending patterns and optimize your group finances.
                </p>
              </div>
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
              <div className="flex gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="transition-all duration-200 hover:scale-105">
                    Get Started
                    <DollarSign className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="transition-all duration-200 hover:scale-105">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="relative z-10 flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground"> 2024 SplitEase. All rights reserved.</p>
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

function CurrencyBackground() {
  const [symbols, setSymbols] = useState<{ top: number; left: number; fontSize: number; symbol: string; }[]>([]);

  useEffect(() => {
    const generatedSymbols = [...Array(20)].map(() => {
      const top = Math.random() * 30;
      const left = Math.random() * 30;
      const fontSize = Math.random() * 2 + 1;
      const symbol = ['$', '€', '£', '¥'][Math.floor(Math.random() * 4)];
      return { top, left, fontSize, symbol };
    });
    setSymbols(generatedSymbols);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {symbols.map((item, i) => (
        <div
          key={i}
          className="absolute text-primary animate-float"
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            fontSize: `${item.fontSize}rem`,
            opacity: `${0.2}`,
            animationDuration: `${Math.random() * 5 + 5}s`,
          }}
        >
          {item.symbol}
        </div>
      ))}
    </div>
  );
}

function DotBackground() {
  const [dots, setDots] = useState<{ top: number; left: number; size: number; }[]>([]);

  useEffect(() => {
    const generatedDots = [...Array(50)].map(() => {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const size = Math.random() * 2 + 0.5;
      return { top, left, size };
    });
    setDots(generatedDots);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {dots.map((dot, i) => (
        <div
          key={i}
          className="absolute bg-primary rounded-full animate-float"
          style={{
            top: `${dot.top}%`,
            left: `${dot.left}%`,
            width: `${dot.size}rem`,
            height: `${dot.size}rem`,
            opacity: 0.2,
            animationDuration: `${Math.random() * 5 + 5}s`,
          }}
        />
      ))}
    </div>
  );
}