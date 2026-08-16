import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from './ExpenseForm';

describe('ExpenseForm', () => {
  it('renders in "add" mode by default', () => {
    render(<ExpenseForm onSubmit={vi.fn()} onCancelEdit={vi.fn()} submitting={false} />);

    expect(screen.getByText('Add an expense')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeInTheDocument();
  });

  it('updates the title field as the user types', async () => {
    const user = userEvent.setup();
    render(<ExpenseForm onSubmit={vi.fn()} onCancelEdit={vi.fn()} submitting={false} />);

    const titleInput = screen.getByPlaceholderText('e.g. Grocery run');
    await user.type(titleInput, 'Team lunch');

    expect(titleInput).toHaveValue('Team lunch');
  });

  it('submits the entered values to onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    render(<ExpenseForm onSubmit={onSubmit} onCancelEdit={vi.fn()} submitting={false} />);

    await user.type(screen.getByPlaceholderText('e.g. Grocery run'), 'Team lunch');
    await user.type(screen.getByPlaceholderText('0.00'), '25');
    await user.click(screen.getByRole('button', { name: 'Add expense' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Team lunch', amount: '25', category: 'Food' })
    );
  });

  it('shows the server error message when one is passed in', () => {
    render(
      <ExpenseForm
        onSubmit={vi.fn()}
        onCancelEdit={vi.fn()}
        submitting={false}
        error="Amount must be a positive number."
      />
    );

    expect(screen.getByText('Amount must be a positive number.')).toBeInTheDocument();
  });

  it('disables the submit button and shows "Saving…" while submitting', () => {
    render(<ExpenseForm onSubmit={vi.fn()} onCancelEdit={vi.fn()} submitting={true} />);

    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toBeDisabled();
  });
});
