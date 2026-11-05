import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch all votes, we need both the party and the region
    const { data, error } = await supabase
      .from('votes')
      .select('contender_id, region');

    if (error) throw error;

    // Structure: { "Gauteng": { "ANC": 5, "DA": 2 }, "Western Cape": { "DA": 10 } }
    const results: Record<string, Record<string, number>> = {};
   
    // Initialize all provinces so they show up even if they have 0 votes
    const provinces = [
      "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
      "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
    ];
   
    provinces.forEach(p => { results[p] = {}; });

    // Count the votes
    data.forEach((row) => {
      const party = row.contender_id;
      const region = row.region || "Unknown"; // Fallback if an old vote had no region

      if (!results[region]) results[region] = {}; // In case of "Unknown"
     
      results[region][party] = (results[region][party] || 0) + 1;
    });

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}