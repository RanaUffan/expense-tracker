import ExpenseRow from './ExpenseRow';
import './ExpenseList.css';

export default function ExpenseList({ expenses, onEdit, onDelete, deletingId }) {
  return (
    <ul className="expense-list">
      {expenses.map((expense) => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deletingId === expense.id}
        />
      ))}
    </ul>
  );
}
