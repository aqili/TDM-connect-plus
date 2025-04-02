import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { certificateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, issuer, issueDate, expiryDate, status, description } = await request.json();

    // Check if certificate exists and belongs to the user
    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        id: params.certificateId,
      },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    if (existingCertificate.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updatedCertificate = await prisma.certificate.update({
      where: {
        id: params.certificateId,
      },
      data: {
        name,
        issuer,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        status,
        description,
      },
    });

    return NextResponse.json(updatedCertificate);
  } catch (error) {
    console.error("[CERTIFICATE_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { certificateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if certificate exists and belongs to the user
    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        id: params.certificateId,
      },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    if (existingCertificate.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.certificate.delete({
      where: {
        id: params.certificateId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CERTIFICATE_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 