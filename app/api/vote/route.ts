import { createClient } from '@supabase/supabase-js';
import { validate } from 'south-african-id-validator';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

// Connect to Supabase using the secret keys from .env.local
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { idNumber, address, contenderId, consent, region } = await req.json();

    // 1. Consent Gate
    if (consent !== true) {
      return NextResponse.json({ error: 'You must consent to the privacy policy to vote.' }, { status: 403 });
    }

    // 2. Validate the South African ID
    const result = validate(idNumber);
    if (!result.valid) {
      return NextResponse.json({ error: 'Invalid SA ID: ' + result.error }, { status: 400 });
    }
// --- AGE CHECK (18+) ---
const year = parseInt(idNumber.substring(0, 2));
const month = parseInt(idNumber.substring(2, 4)) - 1; // JS months are 0-indexed
const day = parseInt(idNumber.substring(4, 6));

// Determine the century (if year is 24 or less, it's 2000s, otherwise 1900s)
const currentYear = new Date().getFullYear();
const currentCentury = Math.floor(currentYear / 100) * 100;
let birthYear = currentCentury + year;
if (birthYear > currentYear) {
  birthYear -= 100; // It was the previous century
}

const birthDate = new Date(birthYear, month, day);
const today = new Date();

let age = today.getFullYear() - birthDate.getFullYear();
const m = today.getMonth() - birthDate.getMonth();
if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
  age--;
}

if (age < 18) {
  return NextResponse.json({ error: 'You must be at least 18 years old to vote.' }, { status: 403 });
}
// --- END AGE CHECK ---
    // 3. Hash the ID number (For privacy)
    const voterHash = crypto.createHash('sha256').update(idNumber).digest('hex');

    // 4. Try to insert the vote (The UNIQUE constraint blocks double voting)
    const { error: voteError } = await supabase
      .from('votes')
      .insert({ voter_hash: voterHash, contender_id: contenderId, region: region });

    if (voteError) {
      // 23505 means they already voted
      if (voteError.code === '23505') {
        return NextResponse.json({ error: 'This ID has already been used to vote.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Database error: ' + voteError.message }, { status: 500 });
    }

    // 5. Save the consent record
    await supabase.from('consent_records').insert({
      voter_hash: voterHash,
      consent_version: 'v1.0',
    });

    // (Optional: You can save the address here if you encrypt it first!)

    return NextResponse.json({ success: true, message: 'Vote counted successfully!' });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// Allow the browser to talk to this API
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
