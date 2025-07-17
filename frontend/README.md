# Fraud Detection Dashboard Frontend

A React-based dashboard for visualizing real-time fraud detection data, transaction monitoring, and risk analysis.

## Features

### 📊 **Real-time Charts**
- **Transaction Volume Chart**: Shows transaction count over time with real-time updates
- **Risk Distribution Chart**: Doughnut chart displaying risk level distribution
- **Alert Trends Chart**: Bar chart showing alert frequency over time

### 📈 **Key Metrics Dashboard**
- Total Transactions
- Active Alerts
- High Risk Transactions
- Alert Resolution Rate

### 🚨 **Alert Management**
- Real-time alert table with risk scores
- Alert status tracking (open/resolved)
- Risk level color coding
- Pagination for better performance

### 🔄 **Real-time Updates**
- WebSocket connection for live data updates
- Connection status indicator
- Automatic reconnection handling

## Tech Stack

- **React 19** with TypeScript
- **Chart.js** with **react-chartjs-2** for data visualization
- **styled-components** for styling and theming
- **date-fns** for date formatting
- **TanStack Table** for data tables
- **Zustand** for state management
- **Socket.IO Client** for real-time communication

## Getting Started

### Prerequisites
- Node.js 18+
- Backend server running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## API Integration

The dashboard connects to the backend API endpoints:

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/transactions` - Transaction data
- `GET /api/alerts` - Alert data
- `GET /api/risk-signals` - Risk analysis data

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard component
│   ├── StatsCards.tsx         # Statistics cards
│   ├── ConnectionStatus.tsx   # WebSocket connection status
│   ├── AlertsTable.tsx        # Alerts table with pagination
│   └── charts/
│       ├── TransactionVolumeChart.tsx
│       ├── RiskDistributionChart.tsx
│       └── AlertTrendsChart.tsx
├── services/
│   ├── api.ts                # API service layer
│   └── websocket.ts          # WebSocket service
├── stores/
│   ├── dashboardStore.ts     # Dashboard state management
│   └── websocketStore.ts     # WebSocket state management
├── styles/
│   ├── GlobalStyles.ts       # Global styled-components styles
│   ├── theme.ts              # Theme configuration
│   ├── components.ts         # Reusable styled components
│   └── styled.d.ts           # TypeScript declarations
├── App.tsx                   # Main app component
└── main.tsx                  # App entry point
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Charts

1. Import the required Chart.js components
2. Create a new chart component using react-chartjs-2
3. Add it to the Dashboard component
4. Connect to the appropriate API endpoint

### Styling

The dashboard uses **styled-components** for styling with a comprehensive theme system:

- **Theme-based styling** with consistent colors, spacing, and typography
- **Responsive design** with breakpoint utilities
- **Dark theme** optimized for data visualization
- **Reusable components** for consistent UI patterns

### State Management

The application uses **Zustand** for state management:

- **Dashboard Store**: Manages dashboard data, charts, and pagination
- **WebSocket Store**: Handles real-time connection and event management

### Real-time Features

- **WebSocket Connection**: Real-time data updates from the backend
- **Connection Status**: Visual indicator of connection state
- **Auto-reconnection**: Automatic reconnection on connection loss
- **Event Handling**: Real-time updates for charts and alerts

## Backend Integration

Make sure your backend server is running and has the following endpoints implemented:

- Dashboard statistics endpoint
- Transaction data endpoint
- Alert management endpoints
- Risk analysis endpoints
- WebSocket server for real-time updates

The frontend will automatically connect to `http://localhost:3000` for API calls and WebSocket communication.

## Theme Customization

The application uses a comprehensive theme system that can be customized in `src/styles/theme.ts`:

- **Colors**: Background, text, status, and risk level colors
- **Typography**: Font sizes, weights, and line heights
- **Spacing**: Consistent spacing scale
- **Breakpoints**: Responsive design breakpoints
- **Shadows**: Box shadow utilities
- **Transitions**: Animation timing functions
