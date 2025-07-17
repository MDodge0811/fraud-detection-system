# Fraud Detection Dashboard Frontend

A React-based dashboard for visualizing real-time fraud detection data, transaction monitoring, and risk analysis.

## Features

### 📊 **Real-time Charts**
- **Transaction Volume Chart**: Shows transaction count over the last 24 hours
- **Risk Distribution Chart**: Doughnut chart displaying risk level distribution
- **Alert Trends Chart**: Bar chart showing alert frequency over time

### 📈 **Key Metrics Dashboard**
- Total Transactions
- Active Alerts
- High Risk Transactions
- Average Transaction Amount

### 🚨 **Alert Management**
- Real-time alert table with risk scores
- Alert status tracking (open/resolved)
- Risk level color coding

### 🔄 **Auto-refresh**
- Dashboard data refreshes every 10 seconds
- Real-time updates from the backend API

## Tech Stack

- **React 19** with TypeScript
- **Chart.js** with **react-chartjs-2** for data visualization
- **Tailwind CSS** for styling
- **date-fns** for date formatting
- **TanStack Table** for data tables

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
│   └── Dashboard.tsx          # Main dashboard component
├── services/
│   └── api.ts                # API service layer
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

The dashboard uses Tailwind CSS for styling. All components are responsive and follow a consistent design system.

## Backend Integration

Make sure your backend server is running and has the following endpoints implemented:

- Dashboard statistics endpoint
- Transaction data endpoint
- Alert management endpoints
- Risk analysis endpoints

The frontend will automatically connect to `http://localhost:3000` for API calls.
