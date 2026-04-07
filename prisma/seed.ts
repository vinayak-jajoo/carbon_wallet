import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/db';

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const users = [
    { email: 'admin@carbon.dev', role: 'ADMIN', name: 'Admin User' },
    { email: 'owner@carbon.dev', role: 'PROJECT_OWNER', name: 'Project Owner' },
    { email: 'verifier@carbon.dev', role: 'VERIFIER', name: 'Verifier User' },
    { email: 'buyer@carbon.dev', role: 'BUYER', name: 'Corporate Buyer' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role as Role, password: passwordHash },
      create: { 
        email: u.email, 
        name: u.name, 
        role: u.role as Role, 
        password: passwordHash 
      }
    });
  }

  console.log('Seeded database with demo accounts.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
