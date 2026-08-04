import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Parse a CSV line handling quoted fields properly
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  fields.push(current.trim());

  return fields;
}

/**
 * Normalize track based on Primary Skill Track value
 */
function normalizeTrack(skillTrack) {
  const lower = skillTrack.toLowerCase();

  if (lower.includes('hacking') || lower.includes('developer') || lower.includes('next.js')) {
    return 'dev';
  }
  if (lower.includes('video') || lower.includes('editor')) {
    return 'video';
  }
  if (lower.includes('strategy') || lower.includes('business') || lower.includes('growth')) {
    return 'strategy';
  }
  if (lower.includes('design')) {
    return 'design';
  }

  return 'dev';
}

/**
 * Split tools on commas
 */
function parseTools(toolsString) {
  if (!toolsString) return [];
  return toolsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
}

/**
 * Parse portfolio links - split on comma/space and filter to http(s) URLs
 */
function parsePortfolioLinks(linksString) {
  if (!linksString) return [];

  // Split on comma or space
  const links = linksString.split(/[,\s]+/).filter(l => l.length > 0);

  return links.filter(link => link.startsWith('http://') || link.startsWith('https://'));
}

/**
 * Read and parse CSV file
 */
function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must have header row and at least one data row');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Expected headers
  const expectedHeaders = [
    'Timestamp',
    'Full Name (ชื่อ-นามสกุล)',
    'Nickname (ชื่อเล่น)',
    'Age (อายุ)',
    'School / University (สถานศึกษา & ชั้นปี)',
    'LINE ID',
    'Phone Number (เบอร์โทรศัพท์)',
    'Primary Skill Track (สายงานหลักที่ถนัด)',
    'Tools & Frameworks (เครื่องมือที่ใช้เป็นประจำ)',
    'Portfolio / GitHub / TikTok Links',
    'Anything. Suggestions/ ideas/ comments'
  ];

  // Find column indices
  const columnMap = {};
  expectedHeaders.forEach(header => {
    const idx = headers.findIndex(h => h === header);
    if (idx === -1) {
      throw new Error(`Missing expected header: ${header}`);
    }
    columnMap[header] = idx;
  });

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    const fullName = fields[columnMap['Full Name (ชื่อ-นามสกุล)']];
    const nickname = fields[columnMap['Nickname (ชื่อเล่น)']];

    if (!fullName || !nickname) {
      console.warn(`⚠️  Skipping row ${i + 1}: missing full name or nickname`);
      continue;
    }

    rows.push({
      timestamp: fields[columnMap['Timestamp']] || null,
      full_name: fullName,
      nickname: nickname,
      age: fields[columnMap['Age (อายุ)']] || null,
      school: fields[columnMap['School / University (สถานศึกษา & ชั้นปี)']] || null,
      line_id: fields[columnMap['LINE ID']] || null,
      phone_number: fields[columnMap['Phone Number (เบอร์โทรศัพท์)']] || null,
      track: normalizeTrack(fields[columnMap['Primary Skill Track (สายงานหลักที่ถนัด)']] || ''),
      tools: parseTools(fields[columnMap['Tools & Frameworks (เครื่องมือที่ใช้เป็นประจำ)']] || ''),
      portfolio_links: parsePortfolioLinks(fields[columnMap['Portfolio / GitHub / TikTok Links']] || ''),
      comments: fields[columnMap['Anything. Suggestions/ ideas/ comments']] || null
    });
  }

  return rows;
}

/**
 * Upsert rows into talent_profiles table
 */
async function upsertTalents(rows) {
  console.log(`\n📋 Upserting ${rows.length} talent profiles...`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    console.log(`\n[${i + 1}/${rows.length}] ${row.full_name} (${row.nickname})`);
    console.log(`  Track: ${row.track}`);
    console.log(`  Tools: ${row.tools.length} items`);
    console.log(`  Portfolio: ${row.portfolio_links.length} links`);

    const { data, error } = await supabase
      .from('talent_profiles')
      .upsert(
        {
          full_name: row.full_name,
          nickname: row.nickname,
          age: row.age ? parseInt(row.age, 10) : null,
          school: row.school,
          line_id: row.line_id,
          phone_number: row.phone_number,
          track: row.track,
          tools: row.tools,
          portfolio_links: row.portfolio_links,
          comments: row.comments
        },
        {
          onConflict: 'full_name,nickname'
        }
      )
      .select();

    if (error) {
      console.error(`  ❌ Upsert failed: ${error.message}`);
    } else {
      console.log(`  ✅ Upserted successfully (ID: ${data[0]?.id})`);
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('Usage: node scripts/seed-talent.mjs <path-to-csv>');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading CSV from: ${csvPath}`);

  try {
    const rows = readCSV(csvPath);
    console.log(`✅ Parsed ${rows.length} rows from CSV`);

    // Print sample row
    if (rows.length > 0) {
      console.log('\n📄 Sample parsed row:');
      console.log(JSON.stringify(rows[0], null, 2));
    }

    await upsertTalents(rows);

    console.log('\n🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
