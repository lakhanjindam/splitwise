'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExpenseGroup } from "@/types/expenseGroup";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Import Card components

export default function ExpenseGroupsPage() {
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  const handleAddGroup = () => {
    if (groupName) {
      const newGroup: ExpenseGroup = {
        id: Date.now(),
        name: groupName,
        members: members,
        expenses: [],
      };
      setGroups((prevGroups) => [...prevGroups, newGroup]);
      setGroupName('');
      setMembers([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Manage Expense Groups</h1>
      <div className="mt-4">
        <Input
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <Input
          placeholder="Members (comma separated)"
          value={members.join(', ')}
          onChange={(e) => setMembers(e.target.value.split(',').map(member => member.trim()))}
        />
        <Button onClick={handleAddGroup}>Add Group</Button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>
                Members: {group.members.length} | Total Expenses: {group.expenses.length} | Created: {new Date(group.id).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
