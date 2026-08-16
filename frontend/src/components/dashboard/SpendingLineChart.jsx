import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';
import { formatMoney } from '../../lib/currencies';

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SpendingLineChart({ data, currency }) {
  return (
    <ChartCard title="Spending over time" isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            labelFormatter={formatDateLabel}
            formatter={(value) => formatMoney(value, currency)}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="var(--color-green)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-green)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
