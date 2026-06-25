/**
 * SketchUp .skp file parser
 * Extracts component names, accessories, parts, and materials from .skp files.
 * SKP files are ZIP archives — uses Node.js built-in zlib + manual ZIP parsing.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ACCESSORY_KW = ['سحاب', 'مفصلة', 'مقبض', 'رجل', 'بول اوت', 'سلة', 'ترولي',
  'ريلينج', 'كورنر', 'لازي', 'اكسسوار', 'بول'];
const PART_KW = ['ضلفة', 'قاعدة', 'ظهر', 'جنب', 'رف', 'درج', 'حزام'];
const UNIT_KW = ['وحدة', 'خزانة', 'كابينة'];

const SKIP_KEYS = new Set([
  'SU_DefinitionSet', 'SU_InstanceSet', 'Owner', 'Status', 'Price', 'Size',
  'ladb_opencutlist', 'GSU_ContributorsInfo', 'LastModifiedByKey', 'VersionKey',
  'temp', 'core.presets', 'Url', 'Value', 'Type', 'ModelProperties',
  'Description', 'IsClassified', 'IsDynamic', 'IsLive', 'Name',
  'UnitsOptions', 'LengthPrecision', 'LengthFormat', 'LengthUnit',
  'LengthSnapEnabled', 'LengthSnapLength', 'AnglePrecision', 'AngleSnapEnabled',
  'SnapAngle', 'SuppressUnitsDisplay', 'ForceInchDisplay', 'AreaUnit',
  'VolumeUnit', 'AreaPrecision', 'VolumePrecision', 'PageOptions',
  'ShowTransition', 'TransitionTime', 'SlideshowOptions', 'LoopSlideshow',
  'SlideTime', 'NamedOptions', 'PrintOptions', 'cumulable',
  'ignore_grain_direction', 'instance_count_by_part', 'length_increase',
  'mass', 'numbers', 'orientation_locked_on_axis', 'symmetrical', 'tags',
  'thickness_increase', 'thickness_layer_count', 'uuid', 'width_increase',
  'Layer0', 'Layer_Layer0', 'Arial', 'Tahoma', 'Scene 1', 'Centimeter',
  'Dim', 'Group#1', 'Group#2',
]);

function classifyComponent(name: string): 'accessory' | 'unit' | 'part' | 'other' {
  for (const kw of ACCESSORY_KW) {
    if (name.includes(kw)) return 'accessory';
  }
  for (const kw of UNIT_KW) {
    if (name.includes(kw)) return 'unit';
  }
  for (const kw of PART_KW) {
    if (name.includes(kw)) return 'part';
  }
  return 'other';
}

function extractLengthPrefixedStrings(data: Buffer): string[] {
  const results: string[] = [];
  let pos = 0;
  while (pos < data.length - 8) {
    try {
      const length = data.readUInt32LE(pos);
      if (length >= 2 && length <= 300) {
        const end = pos + 4 + length;
        if (end <= data.length) {
          const chunk = data.slice(pos + 4, end);
          try {
            const text = chunk.toString('utf8');
            const hasArabic = /[\u0600-\u06ff]/.test(text);
            const hasAscii = text.length >= 3 && /^[\x20-\x7e]+$/.test(text);
            const hasNoControl = !/[\x00-\x1f]/.test(text);
            if ((hasArabic || hasAscii) && hasNoControl) {
              results.push(text);
              pos = end;
              continue;
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
    pos++;
  }
  return results;
}

/**
 * Parse a ZIP archive using Python (available on the server) to extract entries.
 * Returns a map of entryName -> Buffer content.
 */
function extractZipEntries(skpPath: string, entryNames: string[]): Map<string, Buffer> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skp_'));
  const result = new Map<string, Buffer>();

  try {
    // Use Python's zipfile module to extract specific entries
    const pyScript = `
import zipfile, sys, os, json
skp_path = sys.argv[1]
out_dir = sys.argv[2]
entries_json = sys.argv[3]
entries = json.loads(entries_json)

with zipfile.ZipFile(skp_path, 'r') as z:
    all_names = z.namelist()
    # Find matching entries
    for entry in all_names:
        for wanted in entries:
            if entry == wanted or entry.startswith(wanted):
                safe = entry.replace('/', '__').replace('\\\\', '__')
                out_path = os.path.join(out_dir, safe)
                with z.open(entry) as f:
                    data = f.read()
                with open(out_path, 'wb') as out:
                    out.write(data)
                print(f"EXTRACTED:{entry}:{safe}")
                break
    # Also list all entries for thumbnail detection
    for name in all_names:
        print(f"ENTRY:{name}")
`;

    const scriptPath = path.join(tmpDir, 'extract.py');
    fs.writeFileSync(scriptPath, pyScript);

    const entriesArg = JSON.stringify(entryNames);
    const output = execSync(
      `python3 "${scriptPath}" "${skpPath}" "${tmpDir}" '${entriesArg}'`,
      { maxBuffer: 50 * 1024 * 1024, timeout: 15000 }
    ).toString();

    // Parse output
    for (const line of output.split('\n')) {
      if (line.startsWith('EXTRACTED:')) {
        const parts = line.split(':');
        const entryName = parts[1];
        const safeName = parts[2];
        const filePath = path.join(tmpDir, safeName);
        if (fs.existsSync(filePath)) {
          result.set(entryName, fs.readFileSync(filePath));
        }
      }
    }

    // Store the full entry list as a special key
    const allEntries = output.split('\n')
      .filter(l => l.startsWith('ENTRY:'))
      .map(l => l.slice(6));
    result.set('__ENTRY_LIST__', Buffer.from(allEntries.join('\n'), 'utf8'));

  } finally {
    // Cleanup
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  }

  return result;
}

export interface SkpComponent {
  name: string;
  type: 'accessory' | 'unit' | 'part' | 'other';
}

export interface SkpParseResult {
  unitName: string | null;
  components: SkpComponent[];
  accessories: string[];
  parts: string[];
  materials: string[];
  summary: {
    unitName: string | null;
    accessories: string[];
    parts: string[];
    materials: string[];
    totalComponents: number;
  };
}

export function parseSkpFile(skpPath: string): SkpParseResult {
  const result: SkpParseResult = {
    unitName: null,
    components: [],
    accessories: [],
    parts: [],
    materials: [],
    summary: {
      unitName: null,
      accessories: [],
      parts: [],
      materials: [],
      totalComponents: 0,
    },
  };

  const entries = extractZipEntries(skpPath, ['meta/meta.dat', 'model.dat', 'materials/']);

  // 1. Get unit name from meta.dat
  const metaData = entries.get('meta/meta.dat');
  if (metaData) {
    const metaText = metaData.toString('utf8', 0, 1000);
    const pathMatch = metaText.match(/\\([^\\]+)\.skp/);
    if (pathMatch) {
      result.unitName = pathMatch[1];
    }
  }

  // 2. Get material names from entry list
  const entryListBuf = entries.get('__ENTRY_LIST__');
  if (entryListBuf) {
    const allEntries = entryListBuf.toString('utf8').split('\n');
    const materialNames = new Set<string>();
    for (const entry of allEntries) {
      if (entry.includes('materials/') && entry.endsWith('material.xml')) {
        const parts = entry.split('materials/');
        if (parts[1]) {
          let matName = parts[1].split('/')[0];
          try {
            const buf = Buffer.from(matName, 'latin1');
            matName = buf.toString('utf8');
          } catch {
            // keep original
          }
          if (matName && matName !== '_' && matName !== '_1' && !matName.startsWith('Layer_')) {
            materialNames.add(matName);
          }
        }
      }
    }
    result.materials = Array.from(materialNames);

    // Extract thumbnail names from entry list
    const thumbnailNames: string[] = [];
    for (const entry of allEntries) {
      if (entry.startsWith('thumbnails/') && entry.endsWith('.png')) {
        let name = entry.slice('thumbnails/'.length, -'.png'.length);
        try {
          name = Buffer.from(name, 'latin1').toString('utf8');
        } catch {
          // keep original
        }
        thumbnailNames.push(name);
      }
    }

    // 3. Extract component names from model.dat
    const modelData = entries.get('model.dat');
    const componentNames = new Set<string>();

    if (modelData) {
      const allStrings = extractLengthPrefixedStrings(modelData);

      for (let i = 0; i < allStrings.length; i++) {
        if (allStrings[i] === 'SU_DefinitionSet') {
          for (let back = 1; back <= 8; back++) {
            if (i - back >= 0) {
              const candidate = allStrings[i - back];
              const hasArabic = /[\u0600-\u06ff]/.test(candidate);
              const isClean = !/[\x00-\x1f]/.test(candidate);
              if (hasArabic && isClean && !SKIP_KEYS.has(candidate)) {
                componentNames.add(candidate);
                break;
              } else if (candidate.length > 2 && !SKIP_KEYS.has(candidate) && isClean && !candidate.startsWith('(')) {
                componentNames.add(candidate);
                break;
              }
            }
          }
        }
      }

      // Add from thumbnail names
      for (const name of thumbnailNames) {
        if (name && !SKIP_KEYS.has(name)) {
          componentNames.add(name);
        }
      }
    }

    // 4. Classify and deduplicate
    const seen = new Set<string>();
    for (const name of Array.from(componentNames).sort()) {
      if (seen.has(name) || SKIP_KEYS.has(name)) continue;
      seen.add(name);

      const type = classifyComponent(name);
      result.components.push({ name, type });

      if (type === 'accessory') result.accessories.push(name);
      else if (type === 'part') result.parts.push(name);
    }
  }

  result.summary = {
    unitName: result.unitName,
    accessories: result.accessories,
    parts: result.parts,
    materials: result.materials,
    totalComponents: result.components.length,
  };

  return result;
}
