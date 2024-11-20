'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Expense } from "@/types/expenseGroup";

interface AddExpenseProps {
  groupId: number;
  onAddExpense: (expense: Expense) => void;
}

export default function AddExpense({ groupId, onAddExpense }: AddExpenseProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paidBy, setPaidBy] = useState('');

  const handleAddExpense = () => {
    if (description && amount && paidBy) {
      const newExpense: Expense = {
        id: Date.now(),
        description,
        amount: parseFloat(amount),
        currency,
        dateCreated: Date.now(),
        paidBy,
      };
      onAddExpense(newExpense);
      setDescription('');
      setAmount('');
      setCurrency('USD');
      setPaidBy('');
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl">Add Expense</h2>
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        placeholder="Currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      />
      <Input
        placeholder="Paid By"
        value={paidBy}
        onChange={(e) => setPaidBy(e.target.value)}
      />
      <Button onClick={handleAddExpense}>Add Expense</Button>
    </div>
  );
}
