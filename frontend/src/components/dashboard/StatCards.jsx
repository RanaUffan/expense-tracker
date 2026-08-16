import { formatMoney } from '../../lib/currencies';
import './StatCards.css';

export default function StatCards({ stats, currency }) {
  const cards = [
    { label: 'Total spent', value: formatMoney(stats.total, currency) },
    { label: 'Expenses', value: stats.count },
    { label: 'Average per expense', value: formatMoney(stats.average, currency) },
    {
      label: 'Top category',
      value: stats.topCategory ? stats.topCategory.category : '—',
      sub: stats.topCategory ? formatMoney(stats.topCategory.amount, currency) : null,
    },
  ];

  return (
    <div className="stat-cards">
      {cards.map((card) => (
        <div className="stat-card" key={card.label}>
          <span className="stat-card__label">{card.label}</span>
          <span className="stat-card__value">{card.value}</span>
          {card.sub && <span className="stat-card__sub">{card.sub}</span>}
        </div>
      ))}
    </div>
  );
}
