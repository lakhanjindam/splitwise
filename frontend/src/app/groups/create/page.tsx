'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { CURRENCIES, GROUP_CATEGORIES, User } from '@/types/group';
import { api } from '@/lib/api-client';

const formSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  currency: z.string({
    required_error: "Please select a currency.",
  }),
  categories: z.array(z.string()),
  members: z.array(z.number()).min(1, 'Select at least one member'),
});

export default function CreateGroupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      currency: "USD",
      categories: [],
      members: [],
    },
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.getUsers();
        console.log('Users response:', response.data);
        if (response.data.status === 'success' && response.data.data) {
          const usersList = response.data.data.users || [];
          console.log('Setting users:', usersList);
          setUsers(usersList);
        } else {
          throw new Error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch users. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchUsers();
  }, [toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const response = await api.createGroup({
        name: values.name,
        currency: values.currency,
        members: values.members,
      });

      if (response.data.status === 'success' && response.data.data) {
        toast({
          title: "Success",
          description: "Group created successfully!",
        });
        router.push(`/groups/${response.data.data.id}`);
      } else {
        throw new Error('Failed to create group');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create a New Group</h1>
        <p className="text-muted-foreground">Create a group to start splitting expenses with your friends.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter group name" {...field} />
                </FormControl>
                <FormDescription>
                  Choose a name that describes your group
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Currency</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? CURRENCIES.find(
                              (currency) => currency.value === field.value
                            )?.label
                          : "Select currency"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {CURRENCIES.map((currency) => (
                          <CommandItem
                            value={currency.label}
                            key={currency.value}
                            onSelect={() => {
                              form.setValue("currency", currency.value);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currency.value === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {currency.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  This will be the default currency for all expenses in this group
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categories</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {GROUP_CATEGORIES.map((category) => (
                    <Badge
                      key={category.value}
                      variant={field.value?.includes(category.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newValue = field.value?.includes(category.value)
                          ? field.value.filter((val) => val !== category.value)
                          : [...(field.value || []), category.value];
                        form.setValue("categories", newValue);
                      }}
                    >
                      {category.icon} {category.label}
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Select categories that best describe your group
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="members"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Members</FormLabel>
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg cursor-pointer"
                        onClick={() => {
                          const newValue = field.value?.includes(user.id)
                            ? field.value.filter((val) => val !== user.id)
                            : [...(field.value || []), user.id];
                          form.setValue("members", newValue);
                        }}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded border",
                            field.value?.includes(user.id)
                              ? "bg-primary"
                              : "bg-background"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{user.username}</span>
                          <span className="text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <FormDescription>
                  Select members to add to your group
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
