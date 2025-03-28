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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const teamLunch = await prisma.$queryRaw<TeamLunchResult[]>`
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
      WHERE tl.id = ${id}
    `;

    if (!teamLunch[0]) {
      return NextResponse.json(
        { error: 'Team lunch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(teamLunch[0]);
  } catch (error) {
    console.error('Failed to fetch team lunch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team lunch' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const json = await request.json();
    const { month, suggestedDate, organizer1Id, organizer2Id, status } = json;

    await prisma.$executeRaw`
      UPDATE TeamLunch
      SET
        month = ${new Date(month)},
        suggestedDate = ${new Date(suggestedDate)},
        organizer1Id = ${organizer1Id},
        organizer2Id = ${organizer2Id},
        status = ${status},
        updatedAt = NOW()
      WHERE id = ${id}
    `;

    const updatedLunch = await prisma.$queryRaw<TeamLunchResult[]>`
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
      WHERE tl.id = ${id}
    `;

    if (!updatedLunch[0]) {
      return NextResponse.json(
        { error: 'Team lunch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLunch[0]);
  } catch (error) {
    console.error('Failed to update team lunch:', error);
    return NextResponse.json(
      { error: 'Failed to update team lunch' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await prisma.$executeRaw`
      DELETE FROM TeamLunch
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete team lunch:', error);
    return NextResponse.json(
      { error: 'Failed to delete team lunch' },
      { status: 500 }
    );
  }
} 