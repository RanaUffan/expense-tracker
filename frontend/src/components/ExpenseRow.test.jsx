import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseRow from './ExpenseRow';

const sampleExpense = {
  id: 'exp-1',
  title: 'Grocery run',
  amount: 45.5,
  currency: 'USD',
  category: 'Food',
  createdAt: '2026-07-25T07:23:57.137Z',
};

describe('ExpenseRow', () => {
  it('renders the title, category, and formatted amount', () => {
    render(<ExpenseRow expense={sampleExpense} onEdit={() => {}} onDelete={() => {}} />);

    expect(screen.getByText('Grocery run')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('$45.50')).toBeInTheDocument();
  });

  it('calls onEdit with the expense when Edit is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<ExpenseRow expense={sampleExpense} onEdit={onEdit} onDelete={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledWith(sampleExpense);
  });

  it('calls onDelete with the expense id when Delete is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<ExpenseRow expense={sampleExpense} onEdit={() => {}} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith('exp-1');
  });

  it('shows "Deleting…" and disables buttons while isDeleting is true', () => {
    render(<ExpenseRow expense={sampleExpense} onEdit={() => {}} onDelete={() => {}} isDeleting />);

    const deleteButton = screen.getByRole('button', { name: 'Deleting…' });
    expect(deleteButton).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
  });
});
