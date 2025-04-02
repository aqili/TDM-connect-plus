const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        role: true,
      },
    });

    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Status: ${user.status}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 