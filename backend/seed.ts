import { prisma } from './prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await prisma.audit_logs.deleteMany();
    await prisma.alerts.deleteMany();
    await prisma.risk_signals.deleteMany();
    await prisma.training_data.deleteMany();
    await prisma.transactions.deleteMany();
    await prisma.devices.deleteMany();
    await prisma.users.deleteMany();
    await prisma.merchants.deleteMany();

    console.log('🧹 Cleared existing data');

    // Create users
    const users = await Promise.all([
      prisma.users.create({
        data: {
          name: 'John Smith',
          email: 'john.smith@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'Michael Brown',
          email: 'michael.brown@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'Emily Davis',
          email: 'emily.davis@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'David Wilson',
          email: 'david.wilson@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'Lisa Anderson',
          email: 'lisa.anderson@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'Robert Taylor',
          email: 'robert.taylor@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'Jennifer Martinez',
          email: 'jennifer.martinez@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'Christopher Garcia',
          email: 'christopher.garcia@email.com',
        },
      }),
      prisma.users.create({
        data: {
          name: 'Amanda Rodriguez',
          email: 'amanda.rodriguez@email.com',
        },
      }),
    ]);

    console.log(`👥 Created ${users.length} users`);

    // Create devices for each user
    const devices = [];
    for (const user of users) {
      const userDevices = await Promise.all([
        prisma.devices.create({
          data: {
            user_id: user.user_id,
            fingerprint: `device_${user.user_id}_${Math.random().toString(36).substr(2, 9)}`,
          },
        }),
        prisma.devices.create({
          data: {
            user_id: user.user_id,
            fingerprint: `mobile_${user.user_id}_${Math.random().toString(36).substr(2, 9)}`,
          },
        }),
      ]);
      devices.push(...userDevices);
    }

    console.log(`📱 Created ${devices.length} devices`);

    // Create merchants with varying risk levels
    const merchants = await Promise.all([
      prisma.merchants.create({
        data: {
          name: 'Amazon.com',
          category: 'E-commerce',
          risk_level: 20,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Starbucks',
          category: 'Food & Beverage',
          risk_level: 15,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Walmart',
          category: 'Retail',
          risk_level: 25,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Uber',
          category: 'Transportation',
          risk_level: 30,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Netflix',
          category: 'Entertainment',
          risk_level: 10,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Crypto Exchange XYZ',
          category: 'Cryptocurrency',
          risk_level: 85,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Online Casino',
          category: 'Gambling',
          risk_level: 90,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Grocery Store',
          category: 'Food',
          risk_level: 20,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Gas Station',
          category: 'Fuel',
          risk_level: 35,
        },
      }),
      prisma.merchants.create({
        data: {
          name: 'Suspicious Merchant',
          category: 'Unknown',
          risk_level: 95,
        },
      }),
    ]);

    console.log(`🏪 Created ${merchants.length} merchants`);

    // Create some initial transactions for training data
    const initialTransactions = [];
    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const device = devices.find(d => d.user_id === user.user_id);
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const amount = Math.floor(Math.random() * 1000) + 1;
      const riskScore = Math.floor(Math.random() * 101);

      const transaction = await prisma.transactions.create({
        data: {
          user_id: user.user_id,
          device_id: device?.device_id,
          merchant_id: merchant.merchant_id,
          amount: amount,
          status: 'completed',
        },
      });

      // Create risk signal
      await prisma.risk_signals.create({
        data: {
          transaction_id: transaction.transaction_id,
          signal_type: 'ml_risk',
          risk_score: riskScore,
        },
      });

      // Create training data
      await prisma.training_data.create({
        data: {
          transaction_id: transaction.transaction_id,
          features_json: {
            amount: amount,
            device_age: Math.floor(Math.random() * 24),
            merchant_risk: merchant.risk_level,
            transaction_frequency: Math.floor(Math.random() * 10),
            avg_user_amount: Math.floor(Math.random() * 500) + 50,
          },
          label: riskScore >= 75 ? 1 : 0,
        },
      });

      // Create alert if high risk
      if (riskScore >= 75) {
        await prisma.alerts.create({
          data: {
            transaction_id: transaction.transaction_id,
            risk_score: riskScore,
            reason: `Initial high risk transaction: $${amount} (Risk: ${riskScore}%)`,
            status: 'open',
          },
        });
      }

      initialTransactions.push(transaction);
    }

    console.log(`💳 Created ${initialTransactions.length} initial transactions`);
    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seed };
