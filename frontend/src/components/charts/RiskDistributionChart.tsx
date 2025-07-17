import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useDashboardStore } from '../../stores';

const RiskDistributionChart: React.FC = () => {
  const getRiskDistributionData = useDashboardStore(state => state.getRiskDistributionData);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution (All Time)</h3>
      <Doughnut
        data={getRiskDistributionData()}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom' as const,
            },
          },
        }}
      />
    </div>
  );
};

export default RiskDistributionChart; 