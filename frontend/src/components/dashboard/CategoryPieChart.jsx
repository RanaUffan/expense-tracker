import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';
import { colorFor } from '../../lib/chartColors';
import { formatMoney } from '../../lib/currencies';

export default function CategoryPieChart({ data, currency }) {
  return (
    <ChartCard title="Category breakdown" isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={entry.category} fill={colorFor(i)} stroke="var(--color-surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatMoney(value, currency)}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 12, color: 'var(--color-ink-soft)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
