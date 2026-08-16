import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCards from './StatCards';

describe('StatCards', () => {
  it('renders all four stat labels with correctly formatted values', () => {
    const stats = {
      total: 150.5,
      count: 3,
      average: 50.17,
      topCategory: { category: 'Food', amount: 80 },
    };

    render(<StatCards stats={stats} currency="USD" />);

    expect(screen.getByText('Total spent')).toBeInTheDocument();
    expect(screen.getByText('$150.50')).toBeInTheDocument();

    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Top category')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('shows a dash for top category when there is no data', () => {
    const stats = { total: 0, count: 0, average: 0, topCategory: null };

    render(<StatCards stats={stats} currency="USD" />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
