import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vacation = await prisma.vacation.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!vacation) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 });
    }

    // Only allow users to view their own vacations unless they're an admin
    if (session.user.role !== 'ADMIN' && vacation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(vacation);
  } catch (error) {
    console.error('Error fetching vacation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

    const body = await request.json();
    const { type, startDate, endDate, description, status } = body;

    // Check if the vacation exists and belongs to the user
    const existingVacation = await prisma.vacation.findUnique({
      where: { id: params.id },
    });

    if (!existingVacation) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 });
    }

    // Only allow users to edit their own vacations unless they're an admin
    if (session.user.role !== 'ADMIN' && existingVacation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow admins to change the status
    const updateData = {
      type,
      startDate,
      endDate,
      description,
      ...(session.user.role === 'ADMIN' ? { status } : {}),
    };

    const vacation = await prisma.vacation.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(vacation);
  } catch (error) {
    console.error('Error updating vacation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

    // Check if the vacation exists and belongs to the user
    const existingVacation = await prisma.vacation.findUnique({
      where: { id: params.id },
    });

    if (!existingVacation) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 });
    }

    // Only allow users to delete their own vacations unless they're an admin
    if (session.user.role !== 'ADMIN' && existingVacation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.vacation.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting vacation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 