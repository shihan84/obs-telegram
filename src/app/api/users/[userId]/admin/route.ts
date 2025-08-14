import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const userIdNum = parseInt(userId);
    const { isAdmin } = await request.json();
    
    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'isAdmin must be a boolean' }, { status: 400 });
    }

    await db.telegramUser.update({
      where: { id: userIdNum },
      data: { isAdmin }
    });

    return NextResponse.json({ message: 'User admin status updated successfully' });
  } catch (error) {
    console.error('Error updating user admin status:', error);
    return NextResponse.json({ error: 'Failed to update user admin status' }, { status: 500 });
  }
}