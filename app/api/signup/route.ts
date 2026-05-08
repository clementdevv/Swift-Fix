import { NextRequest, NextResponse } from 'next/server'
import { signup } from '@/app/auth/actions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Call the server action
    await signup(formData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    )
  }
}
