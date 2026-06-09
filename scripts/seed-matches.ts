import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper: Convert ET time string to UTC ISO format
// ET = UTC-4 in June/July 2026 (EDT)
function etToUtc(dateStr: string, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const utcHours = hours + 4;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, utcHours, minutes, 0));
  return date.toISOString();
}

// Venue assignments by group
const groupVenues: Record<string, string[]> = {
  A: ['Estadio Azteca, Mexico City', 'Lumen Field, Seattle', 'BC Place, Vancouver'],
  B: ['BC Place, Vancouver', 'BMO Field, Toronto', 'Gillette Stadium, Boston'],
  C: ['Hard Rock Stadium, Miami', 'MetLife Stadium, New York/New Jersey', 'Lincoln Financial Field, Philadelphia'],
  D: ['NRG Stadium, Houston', 'AT&T Stadium, Dallas', 'Arrowhead Stadium, Kansas City'],
  E: ['Mercedes-Benz Stadium, Atlanta', 'NRG Stadium, Houston', 'AT&T Stadium, Dallas'],
  F: ['SoFi Stadium, Los Angeles', "Levi's Stadium, San Francisco Bay Area", 'Lumen Field, Seattle'],
  G: ['Lincoln Financial Field, Philadelphia', 'Gillette Stadium, Boston', 'MetLife Stadium, New York/New Jersey'],
  H: ['Estadio BBVA, Monterrey', 'Estadio Akron, Guadalajara', 'NRG Stadium, Houston'],
  I: ['Hard Rock Stadium, Miami', 'Mercedes-Benz Stadium, Atlanta', 'Arrowhead Stadium, Kansas City'],
  J: ['MetLife Stadium, New York/New Jersey', 'Lincoln Financial Field, Philadelphia', 'Hard Rock Stadium, Miami'],
  K: ['SoFi Stadium, Los Angeles', "Levi's Stadium, San Francisco Bay Area", 'BC Place, Vancouver'],
  L: ['AT&T Stadium, Dallas', 'Arrowhead Stadium, Kansas City', 'Mercedes-Benz Stadium, Atlanta'],
};

// Knockout venues
const knockoutVenues = [
  'MetLife Stadium, New York/New Jersey',
  'Hard Rock Stadium, Miami',
  'AT&T Stadium, Dallas',
  'SoFi Stadium, Los Angeles',
  'NRG Stadium, Houston',
  'Mercedes-Benz Stadium, Atlanta',
  'Lumen Field, Seattle',
  'Estadio Azteca, Mexico City',
];

// DB row type matching fwc_matches schema
interface FwcMatchRow {
  match_number: number;
  team1: string;
  team2: string;
  group_letter: string | null;
  venue: string;
  match_date: string;
  status: string;
  winner: string | null;
  stage: string;
}

// All 72 group stage matches (from official FIFA PDF)
const groupMatches: Array<{
  num: number;
  team1: string;
  team2: string;
  group: string;
  date: string;
  time: string;
}> = [
  { num: 1, team1: 'MEX', team2: 'RSA', group: 'A', date: '2026-06-11', time: '15:00' },
  { num: 2, team1: 'KOR', team2: 'CZE', group: 'A', date: '2026-06-11', time: '22:00' },
  { num: 3, team1: 'CAN', team2: 'BIH', group: 'B', date: '2026-06-11', time: '15:00' },
  { num: 4, team1: 'USA', team2: 'PAR', group: 'D', date: '2026-06-12', time: '21:00' },
  { num: 5, team1: 'HAI', team2: 'SCO', group: 'C', date: '2026-06-12', time: '21:00' },
  { num: 6, team1: 'AUS', team2: 'TUR', group: 'D', date: '2026-06-12', time: '00:00' },
  { num: 7, team1: 'BRA', team2: 'MAR', group: 'C', date: '2026-06-13', time: '18:00' },
  { num: 8, team1: 'QAT', team2: 'SUI', group: 'B', date: '2026-06-13', time: '15:00' },
  { num: 9, team1: 'CIV', team2: 'ECU', group: 'E', date: '2026-06-13', time: '19:00' },
  { num: 10, team1: 'GER', team2: 'CUW', group: 'E', date: '2026-06-14', time: '13:00' },
  { num: 11, team1: 'NED', team2: 'JPN', group: 'F', date: '2026-06-14', time: '16:00' },
  { num: 12, team1: 'SWE', team2: 'TUN', group: 'F', date: '2026-06-14', time: '22:00' },
  { num: 13, team1: 'KSA', team2: 'URU', group: 'H', date: '2026-06-15', time: '18:00' },
  { num: 14, team1: 'ESP', team2: 'CPV', group: 'H', date: '2026-06-15', time: '12:00' },
  { num: 15, team1: 'IRN', team2: 'NZL', group: 'G', date: '2026-06-15', time: '21:00' },
  { num: 16, team1: 'BEL', team2: 'EGY', group: 'G', date: '2026-06-16', time: '15:00' },
  { num: 17, team1: 'FRA', team2: 'SEN', group: 'I', date: '2026-06-16', time: '15:00' },
  { num: 18, team1: 'IRQ', team2: 'NOR', group: 'I', date: '2026-06-16', time: '18:00' },
  { num: 19, team1: 'ARG', team2: 'ALG', group: 'J', date: '2026-06-17', time: '21:00' },
  { num: 20, team1: 'AUT', team2: 'JOR', group: 'J', date: '2026-06-17', time: '00:00' },
  { num: 21, team1: 'GHA', team2: 'PAN', group: 'L', date: '2026-06-17', time: '19:00' },
  { num: 22, team1: 'ENG', team2: 'CRO', group: 'L', date: '2026-06-17', time: '16:00' },
  { num: 23, team1: 'POR', team2: 'COD', group: 'K', date: '2026-06-18', time: '13:00' },
  { num: 24, team1: 'UZB', team2: 'COL', group: 'K', date: '2026-06-18', time: '22:00' },
  { num: 25, team1: 'CZE', team2: 'RSA', group: 'A', date: '2026-06-18', time: '12:00' },
  { num: 26, team1: 'SUI', team2: 'BIH', group: 'B', date: '2026-06-18', time: '15:00' },
  { num: 27, team1: 'CAN', team2: 'QAT', group: 'B', date: '2026-06-19', time: '18:00' },
  { num: 28, team1: 'MEX', team2: 'KOR', group: 'A', date: '2026-06-19', time: '21:00' },
  { num: 29, team1: 'BRA', team2: 'HAI', group: 'C', date: '2026-06-19', time: '20:30' },
  { num: 30, team1: 'SCO', team2: 'MAR', group: 'C', date: '2026-06-19', time: '18:00' },
  { num: 31, team1: 'TUR', team2: 'PAR', group: 'D', date: '2026-06-20', time: '23:00' },
  { num: 32, team1: 'USA', team2: 'AUS', group: 'D', date: '2026-06-20', time: '15:00' },
  { num: 33, team1: 'GER', team2: 'CIV', group: 'E', date: '2026-06-20', time: '16:00' },
  { num: 34, team1: 'ECU', team2: 'CUW', group: 'E', date: '2026-06-20', time: '20:00' },
  { num: 35, team1: 'NED', team2: 'SWE', group: 'F', date: '2026-06-21', time: '13:00' },
  { num: 36, team1: 'TUN', team2: 'JPN', group: 'F', date: '2026-06-21', time: '00:00' },
  { num: 37, team1: 'URU', team2: 'CPV', group: 'H', date: '2026-06-21', time: '18:00' },
  { num: 38, team1: 'ESP', team2: 'KSA', group: 'H', date: '2026-06-21', time: '12:00' },
  { num: 39, team1: 'BEL', team2: 'IRN', group: 'G', date: '2026-06-22', time: '15:00' },
  { num: 40, team1: 'NZL', team2: 'EGY', group: 'G', date: '2026-06-22', time: '21:00' },
  { num: 41, team1: 'NOR', team2: 'SEN', group: 'I', date: '2026-06-22', time: '20:00' },
  { num: 42, team1: 'FRA', team2: 'IRQ', group: 'I', date: '2026-06-22', time: '17:00' },
  { num: 43, team1: 'ARG', team2: 'AUT', group: 'J', date: '2026-06-23', time: '13:00' },
  { num: 44, team1: 'JOR', team2: 'ALG', group: 'J', date: '2026-06-23', time: '23:00' },
  { num: 45, team1: 'ENG', team2: 'GHA', group: 'L', date: '2026-06-23', time: '16:00' },
  { num: 46, team1: 'PAN', team2: 'CRO', group: 'L', date: '2026-06-23', time: '19:00' },
  { num: 47, team1: 'POR', team2: 'UZB', group: 'K', date: '2026-06-24', time: '13:00' },
  { num: 48, team1: 'COL', team2: 'COD', group: 'K', date: '2026-06-24', time: '22:00' },
  { num: 49, team1: 'SCO', team2: 'BRA', group: 'C', date: '2026-06-24', time: '18:00' },
  { num: 50, team1: 'MAR', team2: 'HAI', group: 'C', date: '2026-06-24', time: '18:00' },
  { num: 51, team1: 'SUI', team2: 'CAN', group: 'B', date: '2026-06-25', time: '15:00' },
  { num: 52, team1: 'BIH', team2: 'QAT', group: 'B', date: '2026-06-25', time: '15:00' },
  { num: 53, team1: 'CZE', team2: 'MEX', group: 'A', date: '2026-06-25', time: '21:00' },
  { num: 54, team1: 'RSA', team2: 'KOR', group: 'A', date: '2026-06-25', time: '21:00' },
  { num: 55, team1: 'CUW', team2: 'CIV', group: 'E', date: '2026-06-25', time: '16:00' },
  { num: 56, team1: 'ECU', team2: 'GER', group: 'E', date: '2026-06-25', time: '16:00' },
  { num: 57, team1: 'JPN', team2: 'SWE', group: 'F', date: '2026-06-26', time: '19:00' },
  { num: 58, team1: 'TUN', team2: 'NED', group: 'F', date: '2026-06-26', time: '19:00' },
  { num: 59, team1: 'TUR', team2: 'USA', group: 'D', date: '2026-06-26', time: '22:00' },
  { num: 60, team1: 'PAR', team2: 'AUS', group: 'D', date: '2026-06-26', time: '22:00' },
  { num: 61, team1: 'NOR', team2: 'FRA', group: 'I', date: '2026-06-26', time: '15:00' },
  { num: 62, team1: 'SEN', team2: 'IRQ', group: 'I', date: '2026-06-26', time: '15:00' },
  { num: 63, team1: 'EGY', team2: 'IRN', group: 'G', date: '2026-06-27', time: '23:00' },
  { num: 64, team1: 'NZL', team2: 'BEL', group: 'G', date: '2026-06-27', time: '23:00' },
  { num: 65, team1: 'CPV', team2: 'KSA', group: 'H', date: '2026-06-27', time: '20:00' },
  { num: 66, team1: 'URU', team2: 'ESP', group: 'H', date: '2026-06-27', time: '20:00' },
  { num: 67, team1: 'PAN', team2: 'ENG', group: 'L', date: '2026-06-27', time: '17:00' },
  { num: 68, team1: 'CRO', team2: 'GHA', group: 'L', date: '2026-06-27', time: '17:00' },
  { num: 69, team1: 'ALG', team2: 'AUT', group: 'J', date: '2026-06-28', time: '22:00' },
  { num: 70, team1: 'JOR', team2: 'ARG', group: 'J', date: '2026-06-28', time: '22:00' },
  { num: 71, team1: 'COL', team2: 'POR', group: 'K', date: '2026-06-28', time: '19:30' },
  { num: 72, team1: 'COD', team2: 'UZB', group: 'K', date: '2026-06-28', time: '19:30' },
];

// Stage mapping for knockout rounds
function getStage(matchNum: number): string {
  if (matchNum <= 72) return 'group';
  if (matchNum <= 88) return 'round32';
  if (matchNum <= 96) return 'round16';
  if (matchNum <= 100) return 'quarter';
  if (matchNum <= 102) return 'semi';
  if (matchNum === 103) return 'bronze';
  return 'final';
}

async function main() {
  console.log('🏆 FIFA World Cup 2026 Match Seeder');
  console.log('====================================\n');

  // Step 1: Delete all existing matches
  console.log('🗑️  Deleting existing fwc_matches...');
  const { error: deleteError } = await supabase
    .from('fwc_matches')
    .delete()
    .gte('match_number', 0);

  if (deleteError) {
    console.error('Error deleting matches:', deleteError);
    process.exit(1);
  }
  console.log('✅ Existing matches deleted.\n');

  // Step 2: Build group stage rows
  console.log('📋 Preparing 72 group stage matches...');
  const allRows: FwcMatchRow[] = [];

  for (const m of groupMatches) {
    const venues = groupVenues[m.group];
    const venueIndex = (m.num - 1) % venues.length;

    allRows.push({
      match_number: m.num,
      team1: m.team1,
      team2: m.team2,
      group_letter: m.group,
      venue: venues[venueIndex],
      match_date: etToUtc(m.date, m.time),
      status: 'upcoming',
      winner: null,
      stage: 'group',
    });
  }

  // Step 3: Build knockout stage rows
  console.log('📋 Preparing 32 knockout stage matches...');

  // Round of 32: Matches 73-88
  const r32Dates = [
    '2026-06-28', '2026-06-28', '2026-06-29', '2026-06-29',
    '2026-06-29', '2026-06-29', '2026-06-30', '2026-06-30',
    '2026-06-30', '2026-06-30', '2026-07-01', '2026-07-01',
    '2026-07-01', '2026-07-01', '2026-07-02', '2026-07-02',
  ];
  const r32Times = [
    '16:00', '20:00', '13:00', '16:00',
    '19:00', '22:00', '13:00', '16:00',
    '19:00', '22:00', '13:00', '16:00',
    '19:00', '22:00', '16:00', '20:00',
  ];
  for (let i = 0; i < 16; i++) {
    allRows.push({
      match_number: 73 + i,
      team1: 'TBD',
      team2: 'TBD',
      group_letter: null,
      venue: knockoutVenues[i % knockoutVenues.length],
      match_date: etToUtc(r32Dates[i], r32Times[i]),
      status: 'upcoming',
      winner: null,
      stage: 'round32',
    });
  }

  // Round of 16: Matches 89-96
  const r16Dates = [
    '2026-07-03', '2026-07-03', '2026-07-04', '2026-07-04',
    '2026-07-05', '2026-07-05', '2026-07-06', '2026-07-06',
  ];
  const r16Times = [
    '16:00', '20:00', '16:00', '20:00',
    '16:00', '20:00', '16:00', '20:00',
  ];
  for (let i = 0; i < 8; i++) {
    allRows.push({
      match_number: 89 + i,
      team1: 'TBD',
      team2: 'TBD',
      group_letter: null,
      venue: knockoutVenues[i % knockoutVenues.length],
      match_date: etToUtc(r16Dates[i], r16Times[i]),
      status: 'upcoming',
      winner: null,
      stage: 'round16',
    });
  }

  // Quarter-Finals: Matches 97-100
  const qfDates = ['2026-07-09', '2026-07-09', '2026-07-10', '2026-07-10'];
  const qfTimes = ['16:00', '20:00', '16:00', '20:00'];
  for (let i = 0; i < 4; i++) {
    allRows.push({
      match_number: 97 + i,
      team1: 'TBD',
      team2: 'TBD',
      group_letter: null,
      venue: knockoutVenues[i],
      match_date: etToUtc(qfDates[i], qfTimes[i]),
      status: 'upcoming',
      winner: null,
      stage: 'quarter',
    });
  }

  // Semi-Finals: Matches 101-102
  allRows.push({
    match_number: 101,
    team1: 'TBD',
    team2: 'TBD',
    group_letter: null,
    venue: 'MetLife Stadium, New York/New Jersey',
    match_date: etToUtc('2026-07-14', '20:00'),
    status: 'upcoming',
    winner: null,
    stage: 'semi',
  });
  allRows.push({
    match_number: 102,
    team1: 'TBD',
    team2: 'TBD',
    group_letter: null,
    venue: 'AT&T Stadium, Dallas',
    match_date: etToUtc('2026-07-15', '20:00'),
    status: 'upcoming',
    winner: null,
    stage: 'semi',
  });

  // Bronze Final: Match 103
  allRows.push({
    match_number: 103,
    team1: 'TBD',
    team2: 'TBD',
    group_letter: null,
    venue: 'Hard Rock Stadium, Miami',
    match_date: etToUtc('2026-07-18', '16:00'),
    status: 'upcoming',
    winner: null,
    stage: 'bronze',
  });

  // Final: Match 104
  allRows.push({
    match_number: 104,
    team1: 'TBD',
    team2: 'TBD',
    group_letter: null,
    venue: 'MetLife Stadium, New York/New Jersey',
    match_date: etToUtc('2026-07-19', '16:00'),
    status: 'upcoming',
    winner: null,
    stage: 'final',
  });

  console.log(`\n📊 Total matches to insert: ${allRows.length}\n`);

  // Step 4: Insert in batches
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < allRows.length; i += batchSize) {
    const batch = allRows.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('fwc_matches')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error inserting batch starting at match ${batch[0].match_number}:`, error);
      process.exit(1);
    }

    inserted += data.length;
    console.log(`  ✅ Inserted matches ${batch[0].match_number}-${batch[batch.length - 1].match_number} (${inserted}/${allRows.length})`);
  }

  console.log(`\n🎉 Successfully seeded ${inserted} matches into fwc_matches!`);
  console.log('\nBreakdown:');
  console.log('  - Group Stage: 72 matches');
  console.log('  - Round of 32: 16 matches');
  console.log('  - Round of 16: 8 matches');
  console.log('  - Quarter-Finals: 4 matches');
  console.log('  - Semi-Finals: 2 matches');
  console.log('  - Bronze Final: 1 match');
  console.log('  - Final: 1 match');
  console.log('  - Total: 104 matches');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
