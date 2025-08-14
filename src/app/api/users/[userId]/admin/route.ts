import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);
    const { isAdmin } = await request.json();
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'isAdmin must be a boolean' }, { status: 400 });
    }

    await db.telegramUser.update({
      where: { id: userId },
      data: { isAdmin }
    });

    return NextResponse.json({ message: 'User admin status updated successfully' });
  } catch (error) {
    console.error('Error updating user admin status:', error);
    return NextResponse.json({ error: 'Failed to update user admin status' }, { status: 500 });
  }
}