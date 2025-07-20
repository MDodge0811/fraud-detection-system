#!/usr/bin/env tsx

import { prisma } from './prisma/client';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  timeframe: string;
  responseTime: number;
  dataSize: number;
  recordCount: number;
}

class PerformanceTester {
  private metrics: PerformanceMetrics[] = [];

  async generateTestData(targetTransactions: number = 25000) {
    console.log(`🔄 Generating ${targetTransactions.toLocaleString()} test records...`);
    
    const startTime = performance.now();
    
    // Get existing count
    const existingCount = await prisma.transactions.count();
    const neededCount = targetTransactions - existingCount;
    
    if (neededCount <= 0) {
      console.log(`✅ Already have ${existingCount} transactions, no need to generate more`);
      return;
    }

    console.log(`📊 Generating ${neededCount.toLocaleString()} additional transactions...`);

    // Batch size for efficient insertion
    const batchSize = 1000;
    const batches = Math.ceil(neededCount / batchSize);

    for (let i = 0; i < batches; i++) {
      const batchCount = Math.min(batchSize, neededCount - (i * batchSize));
      const transactions = this.generateTransactionBatch(batchCount);
      
      await prisma.transactions.createMany({
        data: transactions,
        skipDuplicates: true,
      });

      if ((i + 1) % 10 === 0) {
        console.log(`📦 Generated batch ${i + 1}/${batches} (${((i + 1) * batchSize).toLocaleString()} total)`);
      }
    }

    const endTime = performance.now();
    console.log(`✅ Generated ${neededCount.toLocaleString()} transactions in ${((endTime - startTime) / 1000).toFixed(2)}s`);
  }

  private generateTransactionBatch(count: number) {
    const transactions = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in last 30 days
      const amount = Math.random() * 10000 + 1; // Random amount between $1-$10,000
      
      transactions.push({
        amount: amount.toFixed(2),
        timestamp,
        status: Math.random() > 0.1 ? 'completed' : 'failed',
      });
    }
    
    return transactions;
  }

  async testEndpoint(endpoint: string, timeframe: string = 'all') {
    const url = `http://localhost:3000/api${endpoint}${endpoint.includes('?') ? '&' : '?'}timeframe=${timeframe}`;
    
    console.log(`🧪 Testing: ${url}`);
    
    const startTime = performance.now();
    
    try {
      const response = await fetch(url);
      const endTime = performance.now();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const responseTime = endTime - startTime;
      const dataSize = JSON.stringify(data).length;
      const recordCount = Array.isArray(data.data) ? data.data.length : 1;
      
      this.metrics.push({
        endpoint,
        timeframe,
        responseTime,
        dataSize,
        recordCount,
      });
      
      console.log(`✅ ${endpoint} (${timeframe}): ${responseTime.toFixed(2)}ms, ${(dataSize / 1024).toFixed(2)}KB, ${recordCount} records`);
      
      return data;
    } catch (error) {
      console.error(`❌ Error testing ${endpoint}:`, error);
      return null;
    }
  }

  async runPerformanceTests() {
    console.log('🚀 Starting Performance Tests...\n');
    
    const endpoints = [
      '/dashboard/stats',
      '/dashboard/alert-trends?limit=100',
      '/dashboard/risk-distribution',
      '/dashboard/transaction-volume?limit=100',
      '/dashboard/recent-activity?limit=50',
      '/alerts?limit=100',
      '/transactions?limit=100',
    ];
    
    const timeframes = ['1h', '6h', '12h', '24h', '7d', '30d', 'all'];
    
    for (const endpoint of endpoints) {
      for (const timeframe of timeframes) {
        await this.testEndpoint(endpoint, timeframe);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
      }
    }
  }

  generateReport() {
    console.log('\n📊 Performance Test Report');
    console.log('=' .repeat(50));
    
    // Group by endpoint
    const endpointGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.endpoint]) {
        groups[metric.endpoint] = [];
      }
      groups[metric.endpoint].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetrics[]>);
    
    for (const [endpoint, metrics] of Object.entries(endpointGroups)) {
      console.log(`\n🔗 ${endpoint}`);
      console.log('-'.repeat(30));
      
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
      const avgDataSize = metrics.reduce((sum, m) => sum + m.dataSize, 0) / metrics.length;
      const maxResponseTime = Math.max(...metrics.map(m => m.responseTime));
      const maxDataSize = Math.max(...metrics.map(m => m.dataSize));
      
      console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`Average Data Size: ${(avgDataSize / 1024).toFixed(2)}KB`);
      console.log(`Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
      console.log(`Max Data Size: ${(maxDataSize / 1024).toFixed(2)}KB`);
      
      // Show timeframe breakdown
      console.log('\nTimeframe Breakdown:');
      metrics.forEach(metric => {
        console.log(`  ${metric.timeframe}: ${metric.responseTime.toFixed(2)}ms, ${(metric.dataSize / 1024).toFixed(2)}KB`);
      });
    }
    
    // Overall statistics
    console.log('\n📈 Overall Statistics');
    console.log('-'.repeat(30));
    const totalTests = this.metrics.length;
    const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalTests;
    const avgDataSize = this.metrics.reduce((sum, m) => sum + m.dataSize, 0) / totalTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Average Data Size: ${(avgDataSize / 1024).toFixed(2)}KB`);
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations');
    console.log('-'.repeat(30));
    
    const slowEndpoints = this.metrics.filter(m => m.responseTime > 1000);
    const largeResponses = this.metrics.filter(m => m.dataSize > 1024 * 100); // > 100KB
    
    if (slowEndpoints.length > 0) {
      console.log('🐌 Slow Endpoints (>1s):');
      slowEndpoints.forEach(m => {
        console.log(`  ${m.endpoint} (${m.timeframe}): ${m.responseTime.toFixed(2)}ms`);
      });
    }
    
    if (largeResponses.length > 0) {
      console.log('📦 Large Responses (>100KB):');
      largeResponses.forEach(m => {
        console.log(`  ${m.endpoint} (${m.timeframe}): ${(m.dataSize / 1024).toFixed(2)}KB`);
      });
    }
    
    if (slowEndpoints.length === 0 && largeResponses.length === 0) {
      console.log('✅ All endpoints performing well!');
    }
  }

  async cleanup() {
    await prisma.$disconnect();
  }
}

async function main() {
  const tester = new PerformanceTester();
  
  try {
    // Step 1: Generate test data
    await tester.generateTestData(25000);
    
    // Step 2: Run performance tests
    await tester.runPerformanceTests();
    
    // Step 3: Generate report
    tester.generateReport();
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
} 