import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useDashboardStore } from '../../stores';

const AlertTrendsChart: React.FC = () => {
  const getAlertTrendsData = useDashboardStore(state => state.getAlertTrendsData);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Trends (All Time)</h3>
      <Bar
        data={getAlertTrendsData()}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top' as const,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
};

export default AlertTrendsChart; 