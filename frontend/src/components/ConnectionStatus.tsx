import React from 'react';
import { useDashboardStore } from '@/stores';

const ConnectionStatus: React.FC = () => {
  const connectionStatus = useDashboardStore(state => state.connectionStatus);

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' :
        connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
      }`}></div>
      <span className="text-sm text-gray-600 capitalize">
        {connectionStatus === 'connected' ? 'Live' : connectionStatus}
      </span>
    </div>
  );
};

export default ConnectionStatus; 