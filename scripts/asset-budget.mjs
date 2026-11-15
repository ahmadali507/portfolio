#!/usr/bin/env node
// asset-budget: checks runtime 3D assets against DESIGN.md section 4.
//   public/models:   .glb/.gltf over 5 MB fail; meshes without Draco or Meshopt fail;
//                    embedded PNG/JPEG/WebP textures fail (must be KTX2 via KHR_texture_basisu).
//   public/textures: anything other than a valid .ktx2 fails.
//   Unknown file types warn.
// Exit 1 on any failure.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const MODELS = join(ROOT, 'public', 'models');
const TEXTURES = join(ROOT, 'public', 'textures');
const MAX_GLB_BYTES = 5 * 1024 * 1024;
const GEOMETRY_COMPRESSION = [
  'KHR_draco_mesh_compression',
  'EXT_meshopt_compression',
  'KHR_meshopt_compression',
];
const IGNORED = new Set(['.gitkeep', '.DS_Store', 'README.md']);
const KTX2_MAGIC = Buffer.from([
  0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const errors = [];
const warnings = [];
const rel = (p) => relative(ROOT, p);
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return IGNORED.has(e.name) ? [] : [full];
  });
}

/** Returns the glTF JSON from a .glb, or throws. */
function readGlbJson(buf) {
  if (buf.length < 20 || buf.toString('ascii', 0, 4) !== 'glTF')
    throw new Error('not a GLB (bad magic)');
  const version = buf.readUInt32LE(4);
  if (version !== 2) throw new Error(`unsupported GLB version ${version}`);
  const chunkLength = buf.readUInt32LE(12);
  const chunkType = buf.toString('ascii', 16, 20);
  if (chunkType !== 'JSON') throw new Error('first chunk is not JSON');
  return JSON.parse(buf.toString('utf8', 20, 20 + chunkLength));
}

function checkGltfJson(file, json) {
  const used = new Set([...(json.extensionsUsed ?? []), ...(json.extensionsRequired ?? [])]);
  const meshes = json.meshes ?? [];
  const primitives = meshes.flatMap((m) => m.primitives ?? []);
  if (primitives.length > 0) {
    const compressedByExt = GEOMETRY_COMPRESSION.some((ext) => used.has(ext));
    const dracoPerPrim = primitives.every((p) => p.extensions?.KHR_draco_mesh_compression);
    if (!compressedByExt && !dracoPerPrim) {
      errors.push(
        `${rel(file)}  geometry has no Draco or Meshopt compression (${primitives.length} primitive(s)).`,
      );
    }
  }
  const images = json.images ?? [];
  const textures = json.textures ?? [];
  const usesBasisu = used.has('KHR_texture_basisu');
  const nonKtx = images.filter((img) => {
    const mime = img.mimeType ?? '';
    const uri = img.uri ?? '';
    return mime !== 'image/ktx2' && !/\.ktx2$/i.test(uri);
  });
  if (images.length && nonKtx.length) {
    // A non-KTX2 image is only acceptable as a declared fallback next to a basisu source.
    const fallbackOnly = usesBasisu && textures.every((t) => t.extensions?.KHR_texture_basisu);
    if (fallbackOnly) {
      warnings.push(
        `${rel(file)}  ships ${nonKtx.length} non-KTX2 fallback image(s) alongside KTX2. Confirm they are needed.`,
      );
    } else {
      errors.push(
        `${rel(file)}  has ${nonKtx.length} non-KTX2 texture image(s) (${[...new Set(nonKtx.map((i) => i.mimeType ?? extname(i.uri ?? '') ?? '?'))].join(', ')}).`,
      );
    }
  }
  for (const ext of used) {
    if (!/^(KHR_|EXT_)/.test(ext))
      warnings.push(`${rel(file)}  uses vendor extension ${ext}. Confirm the loader supports it.`);
  }
}

// ---------- models ----------

for (const file of walk(MODELS)) {
  const ext = extname(file).toLowerCase();
  const size = statSync(file).size;
  if (ext === '.glb') {
    if (size > MAX_GLB_BYTES) errors.push(`${rel(file)}  is ${mb(size)}, over the 5 MB limit.`);
    try {
      checkGltfJson(file, readGlbJson(readFileSync(file)));
    } catch (err) {
      errors.push(`${rel(file)}  could not be parsed: ${err.message}`);
    }
  } else if (ext === '.gltf') {
    if (size > MAX_GLB_BYTES) errors.push(`${rel(file)}  is ${mb(size)}, over the 5 MB limit.`);
    try {
      checkGltfJson(file, JSON.parse(readFileSync(file, 'utf8')));
    } catch (err) {
      errors.push(`${rel(file)}  could not be parsed: ${err.message}`);
    }
  } else if (ext === '.bin') {
    if (size > MAX_GLB_BYTES) errors.push(`${rel(file)}  is ${mb(size)}, over the 5 MB limit.`);
  } else if (ext === '.ktx2') {
    // Allowed next to a .gltf that references it.
  } else if (['.png', '.jpg', '.jpeg', '.webp', '.avif'].includes(ext)) {
    errors.push(`${rel(file)}  is a ${ext} texture. Convert to KTX2.`);
  } else {
    warnings.push(`${rel(file)}  unknown model asset type (${ext || 'no extension'}).`);
  }
}

// ---------- textures ----------

for (const file of walk(TEXTURES)) {
  const ext = extname(file).toLowerCase();
  if (ext === '.ktx2') {
    const head = readFileSync(file).subarray(0, 12);
    if (!head.equals(KTX2_MAGIC))
      errors.push(`${rel(file)}  has a .ktx2 extension but is not a KTX2 file.`);
  } else if (
    ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.bmp', '.tga', '.tif', '.tiff'].includes(
      ext,
    )
  ) {
    errors.push(`${rel(file)}  is not KTX2. Encode it with KTX-Software or gltf-transform.`);
  } else {
    warnings.push(`${rel(file)}  unknown texture type (${ext || 'no extension'}). Expected .ktx2.`);
  }
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
const count = walk(MODELS).length + walk(TEXTURES).length;
if (errors.length) {
  console.error(
    `\nasset-budget: ${errors.length} error(s), ${warnings.length} warning(s) across ${count} asset(s).`,
  );
  process.exit(1);
}
console.log(`asset-budget: clean. ${warnings.length} warning(s) across ${count} asset(s).`);
