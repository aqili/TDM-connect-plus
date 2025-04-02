const { PrismaClient, Role, UserStatus, UserPortfolio } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const name = 'Admin User';
  const role = Role.ADMIN;
  const portfolio = UserPortfolio.PRODUCTS_SAFETY_LOGISTICS;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists');
      return;
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        status: UserStatus.ACTIVE,
        portfolio
      }
    });

    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      portfolio: user.portfolio
    });
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 