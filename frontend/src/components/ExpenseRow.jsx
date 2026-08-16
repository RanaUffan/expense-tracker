import { formatMoney } from '../lib/currencies';
import './ExpenseRow.css';

export default function ExpenseRow({ expense, onEdit, onDelete, isDeleting }) {
  const formatted = formatMoney(expense.amount, expense.currency);
  const date = new Date(expense.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <li className={`expense-row ${isDeleting ? 'expense-row--deleting' : ''}`}>
      {expense.receiptUrl && (
        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" title="View receipt">
          <img
            className="expense-row__receipt"
            src={expense.receiptUrl}
            alt={`Receipt for ${expense.title}`}
            loading="lazy"
          />
        </a>
      )}
      <div className="expense-row__main">
        <p className="expense-row__title">{expense.title}</p>
        <div className="expense-row__meta">
          <span className="expense-row__category">{expense.category}</span>
          <span className="expense-row__date">{date}</span>
          {expense.paymentMethod && (
            <span className="expense-row__payment">{expense.paymentMethod}</span>
          )}
        </div>
      </div>

      <span className="expense-row__amount">{formatted}</span>

      <div className="expense-row__actions">
        <button
          className="expense-row__btn"
          onClick={() => onEdit(expense)}
          disabled={isDeleting}
        >
          Edit
        </button>
        <button
          className="expense-row__btn expense-row__btn--danger"
          onClick={() => onDelete(expense.id)}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </li>
  );
}
