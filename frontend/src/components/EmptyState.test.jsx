import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the expected heading and hint text', () => {
    render(<EmptyState />);

    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
    expect(screen.getByText(/add your first one/i)).toBeInTheDocument();
  });
});
