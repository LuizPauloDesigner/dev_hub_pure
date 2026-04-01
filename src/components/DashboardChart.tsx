import { memo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  labels: string[];
  focusCycles: number[];
  moodAvg: (number | null)[];
}

const DashboardChart = memo(({ labels, focusCycles, moodAvg }: ChartComponentProps) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ciclos de Foco',
        data: focusCycles,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'Humor Médio',
        data: moodAvg,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Ciclos de Foco',
        },
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Humor (1-5)',
        },
        min: 1,
        max: 5,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ height: '250px' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
});

DashboardChart.displayName = 'DashboardChart';

export default DashboardChart;
