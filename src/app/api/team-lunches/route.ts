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

    const teamLunches = await prisma.teamLunch.findMany({
      include: {
        organizer1: {
          select: {
            id: true,
            name: true,
          },
        },
        organizer2: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        month: 'desc',
      },
    });

    return NextResponse.json(teamLunches);
  } catch (error) {
    console.error('Error fetching team lunches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { month, suggestedDate, organizer1Id, organizer2Id } = body;

    const teamLunch = await prisma.teamLunch.create({
      data: {
        month: new Date(month),
        suggestedDate: new Date(suggestedDate),
        organizer1Id,
        organizer2Id,
        status: 'NEW',
      },
      include: {
        organizer1: {
          select: {
            id: true,
            name: true,
          },
        },
        organizer2: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(teamLunch);
  } catch (error) {
    console.error('Error creating team lunch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 