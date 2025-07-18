# Testing and ML Guide for Fraud Detection System

## Overview

This document provides comprehensive guidance for testing the fraud detection system, including frontend tests, backend tests, ML model testing, and CI/CD integration.

## Frontend Testing

### Test Setup

The frontend uses Vitest with React Testing Library for component testing. The test environment is configured with:

- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Environment**: jsdom
- **Coverage**: v8 coverage provider
- **Mocking**: Vitest mocking utilities

### Test Structure

```
frontend/src/test/
├── setup.ts                 # Global test setup
├── Dashboard.test.tsx       # Dashboard component tests
└── components/              # Individual component tests
    ├── StatsCards.test.tsx
    ├── ConnectionStatus.test.tsx
    └── AlertsTable.test.tsx
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test Dashboard.test.tsx
```

### Test Patterns

#### Component Testing with Theme Provider

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import Component from '@/components/Component';

// Test wrapper with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />, { wrapper: TestWrapper });
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

#### Store Mocking

```typescript
// Mock Zustand stores
vi.mock('@/stores', () => ({
  useDashboardStore: vi.fn((selector) => {
    const state = {
      loading: false,
      stats: { totalTransactions: 1000 },
      // ... other state properties
    };
    
    if (typeof selector === 'function') {
      return selector(state);
    }
    
    return state;
  }),
}));
```

### Test Coverage Goals

- **Statements**: 80%+
- **Branches**: 70%+
- **Functions**: 80%+
- **Lines**: 80%+

## Backend Testing

### Test Setup

The backend uses Jest with Supertest for API testing and Prisma for database testing.

### Test Structure

```
backend/tests/
├── setup.ts                    # Test setup
├── globalSetup.ts              # Global test setup
├── unit/                       # Unit tests
│   ├── services/
│   │   ├── riskAnalyzer.test.ts
│   │   ├── mlRiskAnalyzer.test.ts
│   │   └── transactionSimulator.test.ts
│   └── routes/
│       └── ml.test.ts
├── integration/                # Integration tests
│   ├── api.test.ts
│   └── database.test.ts
└── e2e/                        # End-to-end tests
    └── workflow.test.ts
```

### Running Backend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm test -- --testNamePattern="Risk Analyzer"

# Run integration tests
npm run test:integration

# Run with coverage
npm test -- --coverage
```

### Database Testing

```typescript
import { PrismaClient } from '@prisma/client';
import { beforeEach, afterEach } from 'vitest';

const prisma = new PrismaClient();

beforeEach(async () => {
  // Clean database before each test
  await prisma.transaction.deleteMany();
  await prisma.alert.deleteMany();
  // ... clean other tables
});

afterEach(async () => {
  // Clean up after each test
  await prisma.$disconnect();
});
```

## ML Model Testing

### Model Validation

The ML model uses logistic regression for fraud detection. Testing includes:

1. **Feature Engineering Tests**
2. **Model Training Tests**
3. **Prediction Accuracy Tests**
4. **Performance Tests**

### ML Test Structure

```typescript
describe('ML Risk Analyzer', () => {
  it('should extract features correctly', () => {
    const transaction = {
      amount: 5000,
      user_id: 'user123',
      merchant_id: 'merchant456',
      device_id: 'device789',
      timestamp: new Date(),
    };
    
    const features = extractFeatures(transaction);
    expect(features).toHaveLength(5);
    expect(features[0]).toBeCloseTo(0.5); // normalized amount
  });

  it('should predict fraud risk correctly', () => {
    const features = [0.5, 2.0, 0.8, 3, 0.5];
    const prediction = model.predict(features);
    expect(prediction).toBeGreaterThanOrEqual(0);
    expect(prediction).toBeLessThanOrEqual(1);
  });

  it('should achieve minimum accuracy', () => {
    const accuracy = evaluateModel(testData);
    expect(accuracy).toBeGreaterThan(0.8);
  });
});
```

### Model Performance Metrics

- **Accuracy**: >80%
- **Precision**: >75%
- **Recall**: >70%
- **F1-Score**: >72%
- **AUC-ROC**: >0.85

## CI/CD Integration

### GitHub Actions Workflows

#### Frontend Tests (`/.github/workflows/test.yml`)

```yaml
name: Frontend Tests
on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']
  pull_request:
    branches: [main, develop]
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run linter
      run: |
        cd frontend
        npm run lint
    
    - name: Run tests
      run: |
        cd frontend
        npm test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: frontend/coverage/coverage-final.json
        flags: frontend
        name: frontend-coverage
```

#### Backend Tests (`/.github/workflows/backend-test.yml`)

```yaml
name: Backend Tests
on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main, develop]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: fraud_detection_test
          POSTGRES_USER: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Generate Prisma client
      run: |
        cd backend
        npx prisma generate
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/fraud_detection_test
    
    - name: Run database migrations
      run: |
        cd backend
        npx prisma db push --accept-data-loss
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://test:test@localhost:5432/fraud_detection_test
    
    - name: Run linter
      run: |
        cd backend
        npm run lint
    
    - name: Run tests
      run: |
        cd backend
        npm test
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://test:test@localhost:5432/fraud_detection_test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: backend/coverage/lcov.info
        flags: backend
        name: backend-coverage
```

### Test Environment Variables

#### Frontend Test Environment

```bash
# .env.test
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
NODE_ENV=test
```

#### Backend Test Environment

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/fraud_detection_test
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/fraud_detection_test
PORT=3001
JWT_SECRET=test-secret-key
```

## Best Practices

### Frontend Testing

1. **Component Isolation**: Test components in isolation with proper mocks
2. **Theme Provider**: Always wrap components with ThemeProvider in tests
3. **Store Mocking**: Mock Zustand stores with realistic state
4. **User Interactions**: Test user interactions with `@testing-library/user-event`
5. **Accessibility**: Test accessibility with `@testing-library/jest-dom`

### Backend Testing

1. **Database Isolation**: Use separate test database
2. **Transaction Rollback**: Use database transactions for test isolation
3. **API Testing**: Test API endpoints with Supertest
4. **Error Handling**: Test error scenarios and edge cases
5. **Performance**: Test API response times and database query performance

### ML Testing

1. **Feature Validation**: Test feature extraction logic
2. **Model Accuracy**: Validate model performance metrics
3. **Data Quality**: Test with various data scenarios
4. **Performance**: Test prediction speed and memory usage
5. **Edge Cases**: Test with extreme values and missing data

## Troubleshooting

### Common Issues

1. **Test Environment Setup**
   - Ensure all dependencies are installed
   - Check environment variables are set correctly
   - Verify database connection for backend tests

2. **Mock Issues**
   - Use proper mock structure for Zustand stores
   - Ensure mocks are hoisted correctly
   - Check import/export paths

3. **Coverage Issues**
   - Verify test files are included in coverage
   - Check for untested code paths
   - Ensure all branches are covered

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --reporter=verbose --testNamePattern="Dashboard"

# Debug failing tests
npm test -- --reporter=verbose --no-coverage
```

## Performance Testing

### Load Testing

```bash
# Run load tests
npm run test:load

# Run stress tests
npm run test:stress

# Run performance benchmarks
npm run test:performance
```

### Performance Metrics

- **API Response Time**: <200ms for 95th percentile
- **Database Query Time**: <50ms for complex queries
- **Memory Usage**: <512MB for backend, <256MB for frontend
- **CPU Usage**: <70% under normal load

## Security Testing

### Security Scans

```bash
# Run security audit
npm audit

# Run Snyk security scan
npx snyk test

# Run OWASP ZAP scan
npm run test:security
```

### Security Test Coverage

- **Input Validation**: Test all user inputs
- **Authentication**: Test authentication flows
- **Authorization**: Test access control
- **Data Protection**: Test data encryption
- **SQL Injection**: Test database queries

## Conclusion

This testing framework provides comprehensive coverage for the fraud detection system, ensuring reliability, security, and performance. Regular testing and monitoring help maintain code quality and system stability. 