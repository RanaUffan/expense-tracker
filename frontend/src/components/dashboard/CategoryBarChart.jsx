import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import ChartCard from './ChartCard';
import { colorFor } from '../../lib/chartColors';
import { formatMoney } from '../../lib/currencies';

export default function CategoryBarChart({ data, currency }) {
  return (
    <ChartCard title="Spending by category" isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value) => formatMoney(value, currency)}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={entry.category} fill={colorFor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
