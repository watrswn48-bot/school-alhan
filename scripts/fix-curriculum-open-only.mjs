import fs from 'node:fs';

const path = 'src/components/CurriculaModule.tsx';
let s = fs.readFileSync(path, 'utf8');

// Remove the non-working in-page audio player completely.
s = s.replace("import React, { useState, useRef } from 'react';", "import React, { useState } from 'react';");
s = s.replace(' Music, FileText, Video, ExternalLink, Plus, Trash2, Search, Layers, Play, Pause, Volume2, VolumeX, Sparkles, CheckCircle2, AlertCircle, X, UploadCloud, ChevronDown, ChevronUp, User', ' Music, FileText, Video, ExternalLink, Plus, Trash2, Search, Layers, Sparkles, CheckCircle2, AlertCircle, X, UploadCloud, ChevronDown, ChevronUp, User');
s = s.replace(/ const \[currentPlayingId[\s\S]*?const \[deleteConfirmId,setDeleteConfirmId\]/, ' const [expandedNotesIds,setExpandedNotesIds]');
s = s.replace(/\n const stopAudio=\(\)=>[\s\S]*?\n const toggleMute=.*?const fmt=.*?;\n/, '\n');
s = s.replace(/\{filteredCurricula\.map\(item=>\{const playing=currentPlayingId===item\.id&&isPlaying;const hasAudio=item\.materialType==='audio'\|\|!!item\.fileName\?\.match\(\/\\\.\(mp3\|wav\|ogg\|m4a\)\$\/i\);const expanded=/, '{filteredCurricula.map(item=>{const expanded=');
s = s.replace(/ \$\{playing\?'border-amber-500\/60':'border-slate-800'\}/g, ' border-slate-800');

const marker = '{hasAudio&&<button onClick={()=>handlePlayAudio(item)}';
const start = s.indexOf(marker);
if (start !== -1) {
  const end = s.indexOf('</button>}', start);
  if (end !== -1) s = s.slice(0, start) + s.slice(end + '</button>}'.length);
}

// Make the visible action unambiguously Open-only. Existing Open links are preserved.
if (!s.includes('>فتح</a>') && !s.includes('> فتح</a>')) {
  const actionClose = '</div></div>{isUploadModalOpen&&';
  const openLink = '<a href={item.fileUrl||undefined} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5"/>فتح</a>';
  // Insert before the card's closing area only when an action row is still present.
  const idx = s.lastIndexOf(actionClose);
  if (idx !== -1) {
    const rowStart = s.lastIndexOf('<div className="mt-4 pt-3 border-t border-slate-800', idx);
    if (rowStart !== -1) {
      const rowEnd = s.indexOf('</div></div>{isUploadModalOpen&&', rowStart);
      if (rowEnd !== -1) s = s.slice(0, rowStart) + '<div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">' + openLink + '</div>' + s.slice(rowEnd + '</div>'.length);
    }
  }
}

fs.writeFileSync(path, s, 'utf8');
console.log('Curriculum player removed; curriculum cards use Open only.');
