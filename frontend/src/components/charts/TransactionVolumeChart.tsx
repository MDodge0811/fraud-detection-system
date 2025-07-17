import React from 'react';
import { Line } from 'react-chartjs-2';
import { useDashboardStore } from '@/stores';

const TransactionVolumeChart: React.FC = () => {
  const getTransactionVolumeData = useDashboardStore(state => state.getTransactionVolumeData);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume (All Time)</h3>
      <Line
        data={getTransactionVolumeData()}
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

export default TransactionVolumeChart; 