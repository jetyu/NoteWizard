import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getVersionFromArgs() {
  const raw = process.argv[2];
  if (!raw) {
    console.error('Usage: node scripts/generateReleaseNotes.js <tag>');
    process.exitCode = 1;
    return null;
  }
  return raw.trim();
}

function extractSection(historyContent, versionWithoutPrefix) {
  const headingPattern = new RegExp(`^### \\[${escapeRegExp(versionWithoutPrefix)}\\](?: - .+)?$`, 'm');
  const headingMatch = historyContent.match(headingPattern);
  if (!headingMatch || headingMatch.index === undefined) {
    throw new Error(`Unable to find changelog entry for version ${versionWithoutPrefix}`);
  }

  const headingLine = headingMatch[0];
  const afterHeadingIndex = headingMatch.index + headingLine.length;
  const remaining = historyContent.slice(afterHeadingIndex);
  const nextHeadingIndex = remaining.search(/\n### \[/);
  const sectionBody = (nextHeadingIndex === -1 ? remaining : remaining.slice(0, nextHeadingIndex)).trim();

  return sectionBody;
}

function buildReleaseNotes({ sectionBody }) {
  const header = '### NoteWizard Release Notes';
  const body = sectionBody.trim();
  const footer = [
    '#### Full Changelog',
    '- [English](https://github.com/jetyu/NoteWizard/blob/main/src/assets/changelog/history_en.md)',
    '- [简体中文](https://github.com/jetyu/NoteWizard/blob/main/src/assets/changelog/history_cn.md)'
  ].join('\n');

  return `${header}\n\n${body ? `${body}\n\n` : ''}${footer}\n`;
}

function main() {
  const tag = getVersionFromArgs();
  if (!tag) {
    return;
  }

  const version = tag.replace(/^v/, '');
  const historyPath = resolve('src/assets/changelog/history_en.md');
  const historyContent = readFileSync(historyPath, 'utf8');

  const sectionBody = extractSection(historyContent, version);
  const notes = buildReleaseNotes({ sectionBody });

  const outputPath = resolve('.github/template/RELEASE_NOTES.md');
  writeFileSync(outputPath, notes, 'utf8');
  console.log(`Generated release notes for ${tag}`);
}

main();
