import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting enhanced database seeding...');

  try {
    // Clear existing data
    console.log('🧹 Cleared existing data');
    await prisma.training_data.deleteMany();
    await prisma.risk_signals.deleteMany();
    await prisma.alerts.deleteMany();
    await prisma.audit_logs.deleteMany();
    await prisma.transactions.deleteMany();
    await prisma.devices.deleteMany();
    await prisma.users.deleteMany();
    await prisma.merchants.deleteMany();
    await prisma.ml_models.deleteMany();

    // Create more users for diverse patterns
    console.log('👥 Created 25 users');
    const users = [];
    for (let i = 1; i <= 25; i++) {
      const user = await prisma.users.create({
        data: {
          name: `User ${i}`,
          email: `user${i}@example.com`,
        },
      });
      users.push(user);
    }

    // Create more devices with varying ages
    console.log('📱 Created 50 devices');
    const devices = [];
    for (let i = 1; i <= 50; i++) {
      const device = await prisma.devices.create({
        data: {
          user_id: users[Math.floor(Math.random() * users.length)].user_id,
          fingerprint: `device_${i}_${Math.random().toString(36).substr(2, 9)}`,
          last_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random age up to 30 days
        },
      });
      devices.push(device);
    }

    // Create merchants with diverse risk levels
    console.log('🏪 Created 20 merchants with diverse risk levels');
    const merchants = [];
    
    // Low-risk merchants (40%)
    const lowRiskMerchants = [
      { name: 'Starbucks Coffee', category: 'Food & Beverage', risk_level: 15 },
      { name: 'Walmart', category: 'Retail', risk_level: 20 },
      { name: 'Shell Gas Station', category: 'Gas Station', risk_level: 25 },
      { name: 'McDonald\'s', category: 'Fast Food', risk_level: 18 },
      { name: 'Target', category: 'Retail', risk_level: 22 },
      { name: 'CVS Pharmacy', category: 'Pharmacy', risk_level: 28 },
      { name: 'Subway', category: 'Fast Food', risk_level: 24 },
      { name: 'Dollar General', category: 'Discount Store', risk_level: 26 },
    ];

    // Medium-risk merchants (35%)
    const mediumRiskMerchants = [
      { name: 'Amazon.com', category: 'E-commerce', risk_level: 45 },
      { name: 'Best Buy', category: 'Electronics', risk_level: 50 },
      { name: 'Home Depot', category: 'Hardware', risk_level: 48 },
      { name: 'Uber', category: 'Transportation', risk_level: 42 },
      { name: 'Netflix', category: 'Entertainment', risk_level: 38 },
      { name: 'Spotify', category: 'Entertainment', risk_level: 40 },
      { name: 'DoorDash', category: 'Food Delivery', risk_level: 44 },
    ];

    // High-risk merchants (25%) - for fraud detection training
    const highRiskMerchants = [
      { name: 'Crypto Exchange Pro', category: 'Cryptocurrency', risk_level: 85 },
      { name: 'Online Casino Royal', category: 'Gambling', risk_level: 90 },
      { name: 'Adult Content Store', category: 'Adult Entertainment', risk_level: 88 },
      { name: 'Offshore Bank Services', category: 'Financial Services', risk_level: 92 },
      { name: 'Dark Web Market', category: 'Illegal Goods', risk_level: 95 },
    ];

    // Create all merchants
    for (const merchantData of [...lowRiskMerchants, ...mediumRiskMerchants, ...highRiskMerchants]) {
      const merchant = await prisma.merchants.create({
        data: merchantData,
      });
      merchants.push(merchant);
    }

    // Create extensive initial transactions with diverse patterns
    console.log('💳 Creating 10,000 initial transactions with diverse patterns...');
    
    // Separate merchants by risk level for targeted training
    const lowRiskMerchantsList = merchants.filter(m => (m.risk_level || 0) < 40);
    const mediumRiskMerchantsList = merchants.filter(m => (m.risk_level || 0) >= 40 && (m.risk_level || 0) < 70);
    const highRiskMerchantsList = merchants.filter(m => (m.risk_level || 0) >= 70);

    for (let i = 1; i <= 10000; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      
      // Determine transaction type for better training data distribution
      const transactionType = Math.random();
      let merchant, amount, isHighRisk;
      
      if (transactionType < 0.65) {
        // Normal transactions (65%) - mostly low risk
        merchant = lowRiskMerchantsList[Math.floor(Math.random() * lowRiskMerchantsList.length)];
        amount = Math.random() * 200 + 10; // $10-$210
        isHighRisk = false;
      } else if (transactionType < 0.85) {
        // Medium transactions (20%) - mix of risk levels
        merchant = mediumRiskMerchantsList[Math.floor(Math.random() * mediumRiskMerchantsList.length)];
        amount = Math.random() * 1000 + 200; // $200-$1200
        isHighRisk = (merchant.risk_level || 0) > 60;
      } else if (transactionType < 0.97) {
        // High-value transactions (12%) - potential fraud
        merchant = highRiskMerchantsList[Math.floor(Math.random() * highRiskMerchantsList.length)];
        amount = Math.random() * 5000 + 1000; // $1000-$6000
        isHighRisk = true;
      } else {
        // Suspicious transactions (3%) - definite fraud patterns
        merchant = highRiskMerchantsList[Math.floor(Math.random() * highRiskMerchantsList.length)];
        amount = Math.random() * 15000 + 8000; // $8000-$23000
        isHighRisk = true;
      }

      // Add some fraud patterns to normal transactions occasionally
      if (!isHighRisk && Math.random() < 0.08) {
        // 8% of normal transactions get suspicious patterns
        amount *= 3; // Increase amount
        isHighRisk = true;
      }

      const transaction = await prisma.transactions.create({
        data: {
          user_id: user.user_id,
          device_id: device.device_id,
          merchant_id: merchant.merchant_id,
          amount: amount,
          status: 'completed',
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
        },
      });

      // Create comprehensive training data
      const deviceAge = Math.floor((Date.now() - new Date(device.last_seen || Date.now()).getTime()) / (1000 * 60 * 60));
      const merchantRisk = merchant.risk_level || 50;
      
      await prisma.training_data.create({
        data: {
          transaction_id: transaction.transaction_id,
          features: {
            amount: amount,
            device_age: deviceAge,
            merchant_risk: merchantRisk,
            transaction_frequency: Math.floor(Math.random() * 15) + 1,
            avg_user_amount: amount * (0.7 + Math.random() * 0.6), // Vary around the actual amount
            normalized_amount: Math.min(amount / 10000, 1),
            normalized_device_age: Math.min(deviceAge / 24, 1),
            normalized_merchant_risk: merchantRisk / 100,
            normalized_frequency: Math.min(Math.floor(Math.random() * 15) + 1, 15) / 15,
            normalized_avg_amount: Math.min(amount / 5000, 1),
          },
          label: isHighRisk ? 1 : 0, // 1 for high risk, 0 for low risk
        },
      });

      // Create risk signals for all transactions
      const riskScore = isHighRisk ? 
        Math.floor(Math.random() * 30) + 70 : // 70-100 for high risk
        Math.floor(Math.random() * 40) + 10;  // 10-50 for low risk

      await prisma.risk_signals.create({
        data: {
          transaction_id: transaction.transaction_id,
          signal_type: 'ml_risk',
          risk_score: riskScore,
        },
      });

      // Create alerts for high-risk transactions
      if (isHighRisk) {
        const riskLevel = riskScore >= 90 ? 'Critical' : riskScore >= 80 ? 'High' : 'Elevated';
        await prisma.alerts.create({
          data: {
            transaction_id: transaction.transaction_id,
            risk_score: riskScore,
            reason: `${riskLevel} risk transaction: $${amount} (${riskScore}%) - ${merchant.name} (${merchant.category})`,
            status: 'open',
          },
        });
      }

      // Progress indicator
      if (i % 500 === 0) {
        console.log(`   Created ${i}/10,000 transactions...`);
      }
    }

    // Create additional fraud pattern transactions for specialized training
    console.log('🚨 Creating 1,000 additional fraud pattern transactions...');
    for (let i = 1; i <= 1000; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const merchant = highRiskMerchantsList[Math.floor(Math.random() * highRiskMerchantsList.length)];

      // Generate specific fraud patterns
      const fraudPatterns = [
        { amount: 9999, description: 'Just under reporting threshold' },
        { amount: 15000, description: 'High-value suspicious transaction' },
        { amount: 500, description: 'Micro-transaction testing' },
        { amount: 25000, description: 'Extremely high-value transaction' },
        { amount: 7500, description: 'Suspicious round amount' },
        { amount: 12000, description: 'High-value crypto transaction' },
        { amount: 300, description: 'Small test transaction' },
        { amount: 18000, description: 'Large gambling transaction' },
      ];

      const pattern = fraudPatterns[Math.floor(Math.random() * fraudPatterns.length)];

      const transaction = await prisma.transactions.create({
        data: {
          user_id: user.user_id,
          device_id: device.device_id,
          merchant_id: merchant.merchant_id,
          amount: pattern.amount,
          status: 'completed',
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      });

      // Create training data with high risk label
      const deviceAge = Math.floor((Date.now() - new Date(device.last_seen || Date.now()).getTime()) / (1000 * 60 * 60));
      const merchantRisk = merchant.risk_level || 90;

      await prisma.training_data.create({
        data: {
          transaction_id: transaction.transaction_id,
          features: {
            amount: pattern.amount,
            device_age: deviceAge,
            merchant_risk: merchantRisk,
            transaction_frequency: Math.floor(Math.random() * 20) + 5, // Higher frequency
            avg_user_amount: pattern.amount * 0.8,
            normalized_amount: Math.min(pattern.amount / 10000, 1),
            normalized_device_age: Math.min(deviceAge / 24, 1),
            normalized_merchant_risk: merchantRisk / 100,
            normalized_frequency: Math.min(Math.floor(Math.random() * 20) + 5, 20) / 20,
            normalized_avg_amount: Math.min(pattern.amount / 5000, 1),
          },
          label: 1, // Always high risk for fraud patterns
        },
      });

      // Create high-risk signal and alert
      const riskScore = Math.floor(Math.random() * 20) + 80; // 80-100

      await prisma.risk_signals.create({
        data: {
          transaction_id: transaction.transaction_id,
          signal_type: 'ml_risk',
          risk_score: riskScore,
        },
      });

      await prisma.alerts.create({
        data: {
          transaction_id: transaction.transaction_id,
          risk_score: riskScore,
          reason: `Fraud pattern detected: $${pattern.amount} (${riskScore}%) - ${pattern.description} at ${merchant.name}`,
          status: 'open',
        },
      });

      // Progress indicator
      if (i % 100 === 0) {
        console.log(`   Created ${i}/1,000 fraud pattern transactions...`);
      }
    }

    // Create rapid succession fraud patterns
    console.log('⚡ Creating 500 rapid succession fraud patterns...');
    for (let i = 1; i <= 500; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const merchant = highRiskMerchantsList[Math.floor(Math.random() * highRiskMerchantsList.length)];

      // Create multiple transactions in rapid succession
      const baseTime = Date.now() - Math.random() * 24 * 60 * 60 * 1000; // Random time in last 24 hours
      
      for (let j = 0; j < 3; j++) { // 3 rapid transactions
        const amount = Math.random() * 2000 + 500; // $500-$2500 each
        
        const transaction = await prisma.transactions.create({
          data: {
            user_id: user.user_id,
            device_id: device.device_id,
            merchant_id: merchant.merchant_id,
            amount: amount,
            status: 'completed',
            timestamp: new Date(baseTime + j * 60000), // 1 minute apart
          },
        });

        const deviceAge = Math.floor((Date.now() - new Date(device.last_seen || Date.now()).getTime()) / (1000 * 60 * 60));
        const merchantRisk = merchant.risk_level || 90;

        await prisma.training_data.create({
          data: {
            transaction_id: transaction.transaction_id,
            features: {
              amount: amount,
              device_age: deviceAge,
              merchant_risk: merchantRisk,
              transaction_frequency: 10 + j, // Increasing frequency
              avg_user_amount: amount * 0.9,
              normalized_amount: Math.min(amount / 10000, 1),
              normalized_device_age: Math.min(deviceAge / 24, 1),
              normalized_merchant_risk: merchantRisk / 100,
              normalized_frequency: Math.min(10 + j, 20) / 20,
              normalized_avg_amount: Math.min(amount / 5000, 1),
            },
            label: 1, // High risk for rapid succession
          },
        });

        const riskScore = 85 + j * 5; // Increasing risk score

        await prisma.risk_signals.create({
          data: {
            transaction_id: transaction.transaction_id,
            signal_type: 'ml_risk',
            risk_score: riskScore,
          },
        });

        await prisma.alerts.create({
          data: {
            transaction_id: transaction.transaction_id,
            risk_score: riskScore,
            reason: `Rapid succession fraud: $${amount} (${riskScore}%) - Transaction ${j + 1}/3 at ${merchant.name}`,
            status: 'open',
          },
        });
      }

      // Progress indicator
      if (i % 50 === 0) {
        console.log(`   Created ${i}/500 rapid succession patterns...`);
      }
    }

    console.log('✅ Enhanced database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${users.length} users created`);
    console.log(`   - ${devices.length} devices created`);
    console.log(`   - ${merchants.length} merchants created`);
    console.log(`   - 11,500 total transactions created (10,000 + 1,000 + 500 patterns)`);
    console.log(`   - 11,500 training data records generated for ML model`);
    console.log(`   - Risk signals and alerts created`);
    console.log(`   - Comprehensive fraud patterns included`);
    console.log('🎉 Ready for advanced fraud detection with polynomial regression!');

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
