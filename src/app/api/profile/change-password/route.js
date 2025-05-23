import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Ensure this path is correct
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmNewPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json({ error: 'All password fields are required.' }, { status: 400 });
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json({ error: 'New passwords do not match.' }, { status: 400 });
    }

    if (newPassword.length < 8) { // Basic password strength check
        return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
    }
    // Add more password strength checks if desired (uppercase, number, special char)

    const { db } = await connectToDatabase();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Incorrect current password.' }, { status: 403 }); // Forbidden
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: { password: hashedNewPassword, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Password could not be updated. It might be the same as the old one.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password changed successfully.' });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password', details: error.message }, { status: 500 });
  }
}
