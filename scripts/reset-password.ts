import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    // Hash the new password
    const hashedPassword = await hash('admin123', 12);

    // Update the admin user's password
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@example.com'
      },
      data: {
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });

    console.log('\nPassword reset successful for user:');
    console.log(JSON.stringify({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      status: updatedUser.status
    }, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 