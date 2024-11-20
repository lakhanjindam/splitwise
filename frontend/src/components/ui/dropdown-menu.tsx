import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils"; // Assume you have a utility for class names

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      {children}
    </DropdownMenuPrimitive.Root>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
}

export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  return (
    <DropdownMenuPrimitive.Trigger asChild>
      {children}
    </DropdownMenuPrimitive.Trigger>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function DropdownMenuContent({ children, align = "center" }: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Content
      align={align}
      className={cn("bg-white dark:bg-gray-800 shadow-lg rounded-md p-2")}
    >
      {children}
    </DropdownMenuPrimitive.Content>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick: () => void;
}

export function DropdownMenuItem({ children, onClick }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      onClick={onClick}
      className={cn("cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700")}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

