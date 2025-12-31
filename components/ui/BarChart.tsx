'use client';

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  height?: number;
}

export default function BarChart({ data, height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 400 ${height}`}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          const barWidth = 400 / data.length - 20;
          const x = index * (400 / data.length) + 10;
          const y = height - barHeight - 20;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                className="transition-all duration-300 hover:opacity-80"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}