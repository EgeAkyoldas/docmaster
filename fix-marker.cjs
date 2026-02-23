const fs = require('fs');

const chatFile = 'src/components/ChatPanel.tsx';
let c = fs.readFileSync(chatFile, 'utf8');

// Normalize to \n for matching, then restore \r\n at end
c = c.replace(/\r\n/g, '\n');

// --- Fix 1: Guided mode system prompt ---
const oldSystemPrompt = '[SYSTEM:OUTPUT_FORMAT] When generating the final document, wrap it in ~~~doc:${docLabel}';
if (c.includes(oldSystemPrompt)) {
  // Replace just the line containing [SYSTEM:OUTPUT_FORMAT] and the line after
  c = c.replace(
    /\[SYSTEM:OUTPUT_FORMAT\] When generating the final document[^\n]*\n\nStart by asking/,
    `[OUTPUT FORMAT — IMPORTANT] When you generate the final document, you MUST wrap it inside these exact markers:\n\n~~~doc:\${docLabel}\n(full document content)\n~~~\n\nWrite a brief intro like "Here is your \${docLabel}:" BEFORE the markers, then put the entire document INSIDE them. Do NOT mention these markers in your response.\n\nStart by asking`
  );
  console.log('Fix 1 (guided system prompt):', c.includes('[OUTPUT FORMAT — IMPORTANT]') ? '✅' : '❌');
} else {
  console.log('Fix 1: already fixed or not found');
}

// --- Fix 2: buildDocPromptLocal update mode ---
if (c.includes('[SYSTEM:OUTPUT_FORMAT] Wrap the updated document')) {
  c = c.replace(
    /\[SYSTEM:OUTPUT_FORMAT\] Wrap the updated document in ~~~doc:\$\{docKey\}[^`]*`/,
    `IMPORTANT: You MUST wrap the updated document inside these exact markers:\n\n~~~doc:\${docKey}\n(full updated document here)\n~~~\n\nWrite a brief intro before the markers. Do not mention these markers.\``
  );
  console.log('Fix 2 (update mode): ✅');
} else {
  console.log('Fix 2: already fixed');
}

// --- Fix 3: handleGuidedGenerate hidden message ---
if (c.includes('[SYSTEM:OUTPUT_FORMAT] Wrap the document in')) {
  c = c.replace(
    /`\[SYSTEM:OUTPUT_FORMAT\] Wrap the document in ~~~doc:\$\{guidedSession\.docType\}[^`]*`/,
    '`IMPORTANT: You MUST wrap the document inside these exact markers:\\n\\n~~~doc:${guidedSession.docType}\\n(full document here)\\n~~~\\n\\nWrite a brief intro before the markers. Do not mention these markers.`'
  );
  console.log('Fix 3 (guided generate): ✅');
} else {
  console.log('Fix 3: already fixed');
}

// --- Fix 4: Topic tracking with checkbox counting ---
if (c.includes('Parse coverage from AI messages or live streaming content: "✅ X/Y topics covered"')) {
  c = c.replace(
    /\/\/ Parse coverage from AI messages or live streaming content: "✅ X\/Y topics covered"\n    useEffect\(\(\) => \{\n      if \(!guidedSession\) return;\n      \/\/ Check streaming content first \(real-time\), then fall back to committed messages\n      const textToCheck = streamingContent \|\|\n        \(\[\.\.\.messages\]\.reverse\(\)\.find\(\(m\) => m\.role === "assistant"\)\?\.content \?\? ""\);\n      const match = textToCheck\.match\(\/✅\\s\*\(\\d\+\)\\\/\(\\d\+\)\\s\*topics\? covered\/i\);\n      if \(match\) \{\n        const answered = parseInt\(match\[1\], 10\);\n        setGuidedSession\(\(prev\) => prev \? \{ \.\.\.prev, answeredCount: answered \} : null\);/,
    `// Parse coverage from AI messages or live streaming content
    // Strategy 1: "✅ X/Y topics covered" summary line
    // Strategy 2: Count [x] checkboxes vs total checkboxes
    useEffect(() => {
      if (!guidedSession) return;
      const textToCheck = streamingContent ||
        ([...messages].reverse().find((m) => m.role === "assistant")?.content ?? "");

      let answered = 0;

      // Strategy 1: explicit "✅ X/Y topics covered"
      const summaryMatch = textToCheck.match(/✅\\s*(\\d+)\\/(\\d+)\\s*topics? covered/i);
      if (summaryMatch) {
        answered = parseInt(summaryMatch[1], 10);
      } else {
        // Strategy 2: count [x] vs [ ] checkboxes
        const checked = (textToCheck.match(/\\[x\\]/gi) || []).length;
        const unchecked = (textToCheck.match(/\\[ \\]/g) || []).length;
        if (checked + unchecked > 0) {
          answered = checked;
        }
      }

      if (answered > 0) {
        setGuidedSession((prev) => prev ? { ...prev, answeredCount: answered } : null);`
  );
  console.log('Fix 4 (topic tracking): ✅');
} else {
  // Simpler approach: line-based replacement
  const lines = c.split('\n');
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Parse coverage from AI messages or live streaming content')) {
      found = true;
      console.log('Fix 4: Found at line', i + 1, '— using line-based replacement');
      // Find the end of this useEffect block
      let endIdx = i;
      for (let j = i; j < Math.min(i + 15, lines.length); j++) {
        if (lines[j].includes('setGuidedSession((prev) => prev ? { ...prev, answeredCount: answered }')) {
          endIdx = j;
          break;
        }
      }
      // Replace lines i to endIdx
      const newLines = [
        '    // Parse coverage from AI messages or live streaming content',
        '    // Strategy 1: "✅ X/Y topics covered" summary line',
        '    // Strategy 2: Count [x] checkboxes vs total checkboxes',
        '    useEffect(() => {',
        '      if (!guidedSession) return;',
        '      const textToCheck = streamingContent ||',
        '        ([...messages].reverse().find((m) => m.role === "assistant")?.content ?? "");',
        '',
        '      let answered = 0;',
        '',
        '      // Strategy 1: explicit "✅ X/Y topics covered"',
        '      const summaryMatch = textToCheck.match(/✅\\s*(\\d+)\\/(\\d+)\\s*topics? covered/i);',
        '      if (summaryMatch) {',
        '        answered = parseInt(summaryMatch[1], 10);',
        '      } else {',
        '        // Strategy 2: count [x] vs [ ] checkboxes',
        '        const checked = (textToCheck.match(/\\[x\\]/gi) || []).length;',
        '        const unchecked = (textToCheck.match(/\\[ \\]/g) || []).length;',
        '        if (checked + unchecked > 0) {',
        '          answered = checked;',
        '        }',
        '      }',
        '',
        '      if (answered > 0) {',
        '        setGuidedSession((prev) => prev ? { ...prev, answeredCount: answered } : null);',
      ];
      lines.splice(i, endIdx - i + 1, ...newLines);
      c = lines.join('\n');
      console.log('Fix 4 (topic tracking): ✅');
      break;
    }
  }
  if (!found) console.log('Fix 4: ❌ not found at all');
}

// Restore CRLF
c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(chatFile, c, 'utf8');

// Final check
const remaining = (c.match(/\[SYSTEM:OUTPUT_FORMAT\]/g) || []).length;
console.log(`\nRemaining [SYSTEM:OUTPUT_FORMAT] instances: ${remaining}`);
console.log('Done!');
