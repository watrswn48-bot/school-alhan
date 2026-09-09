import fs from 'node:fs';

const path = 'src/components/CurriculaModule.tsx';
let s = fs.readFileSync(path, 'utf8');

const required = [
  "const [currentPlayingId",
  "{hasAudio&&<button onClick={()=>handlePlayAudio(item)}",
  "const [deleteConfirmId"
];
for (const marker of required) {
  if (!s.includes(marker)) throw new Error(`Curricula cleanup marker not found: ${marker}`);
}

// The curriculum feature is Drive-link/open only. Remove the old in-page audio player completely.
s = s.replace("import React, { useState, useRef } from 'react';", "import React, { useState } from 'react';");
s = s.replace(', Play, Pause, Volume2, VolumeX', '');
s = s.replace("'شاهد واستمع إلى المواد الخاصة بصفك'", "'شاهد وافتح المواد الخاصة بصفك'");

// Keep the note-expansion and delete-confirmation state; remove all audio state.
s = s.replace(
  / const \[currentPlayingId[\s\S]*?const \[deleteConfirmId,setDeleteConfirmId\]=useState<string\|null>\(null\);/,
  ' const [expandedNotesIds,setExpandedNotesIds]=useState<Record<string,boolean>>({}); const [deleteConfirmId,setDeleteConfirmId]=useState<string|null>(null);'
);

// Remove all audio helper functions between handleDelete and the component return.
s = s.replace(
  /\n const stopAudio=.*?\n const toggleMute=.*?const fmt=.*?;\n/,
  '\n'
);

// Remove the audio-only card state and visual highlight.
s = s.replace(
  /\{filteredCurricula\.map\(item=>\{const playing=currentPlayingId===item\.id&&isPlaying;const hasAudio=item\.materialType==='audio'\|\|!!item\.fileName\?\.match\(\/\\\.\(mp3\|wav\|ogg\|m4a\)\$\/i\);const expanded=/,
  '{filteredCurricula.map(item=>{const expanded='
);
s = s.replace(/ \$\{playing\?'border-amber-500\/60':'border-slate-800'\}/g, ' border-slate-800');

// Remove exactly the old "استمع" button without touching the Open action or delete modal.
const audioStart = s.indexOf('{hasAudio&&<button onClick={()=>handlePlayAudio(item)}');
const audioEnd = s.indexOf('</button>}', audioStart);
if (audioStart < 0 || audioEnd < 0) throw new Error('Could not locate the old curriculum listen button.');
s = s.slice(0, audioStart) + s.slice(audioEnd + '</button>}'.length);

if (/handlePlayAudio|currentPlayingId|isPlaying|audioRef|toggleMute|audioProgress|audioDuration|audioCurrentTime|isMuted|stopAudio|<Play|<Pause|<Volume2|<VolumeX/.test(s)) {
  throw new Error('Old curriculum audio-player code remains after cleanup.');
}
if (!s.includes('>فتح</a>') && !s.includes('>فتح</a>')) {
  throw new Error('Curriculum Open action is missing after audio cleanup.');
}

fs.writeFileSync(path, s, 'utf8');
console.log('Curriculum cleaned: Open-only, no in-page audio player.');
