import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface TeamLunchResult {
  id: string;
  month: Date;
  suggestedDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  organizer1: {
    id: string;
    name: string;
    email: string;
  };
  organizer2: {
    id: string;
    name: string;
    email: string;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamLunches = await prisma.$queryRaw<TeamLunchResult[]>`
      SELECT 
        tl.id,
        tl.month,
        tl.suggestedDate,
        tl.status,
        tl.createdAt,
        tl.updatedAt,
        JSON_OBJECT(
          'id', o1.id,
          'name', o1.name,
          'email', o1.email
        ) as organizer1,
        JSON_OBJECT(
          'id', o2.id,
          'name', o2.name,
          'email', o2.email
        ) as organizer2
      FROM TeamLunch tl
      LEFT JOIN User o1 ON tl.organizer1Id = o1.id
      LEFT JOIN User o2 ON tl.organizer2Id = o2.id
      ORDER BY tl.createdAt DESC
    `;

    return NextResponse.json(teamLunches);
  } catch (error) {
    console.error('Failed to fetch team lunches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team lunches' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { month, suggestedDate, organizer1Id, organizer2Id } = json;

    await prisma.$executeRaw`
      INSERT INTO TeamLunch (
        id,
        month,
        suggestedDate,
        organizer1Id,
        organizer2Id,
        status,
        createdAt,
        updatedAt
      ) VALUES (
        UUID(),
        ${new Date(month)},
        ${new Date(suggestedDate)},
        ${organizer1Id},
        ${organizer2Id},
        'NEW',
        NOW(),
        NOW()
      )
    `;

    const createdLunch = await prisma.$queryRaw<TeamLunchResult[]>`
      SELECT 
        tl.id,
        tl.month,
        tl.suggestedDate,
        tl.status,
        tl.createdAt,
        tl.updatedAt,
        JSON_OBJECT(
          'id', o1.id,
          'name', o1.name,
          'email', o1.email
        ) as organizer1,
        JSON_OBJECT(
          'id', o2.id,
          'name', o2.name,
          'email', o2.email
        ) as organizer2
      FROM TeamLunch tl
      LEFT JOIN User o1 ON tl.organizer1Id = o1.id
      LEFT JOIN User o2 ON tl.organizer2Id = o2.id
      ORDER BY tl.createdAt DESC
      LIMIT 1
    `;

    return NextResponse.json(createdLunch[0]);
  } catch (error) {
    console.error('Failed to create team lunch:', error);
    return NextResponse.json(
      { error: 'Failed to create team lunch' },
      { status: 500 }
    );
  }
} 