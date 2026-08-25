import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('electron', () => ({
  app: { getPath: () => process.cwd() },
  shell: { openPath: vi.fn() },
  BrowserWindow: {
    getFocusedWindow: () => null,
    getAllWindows: () => [],
  },
  dialog: { showMessageBox: vi.fn() },
}));

vi.mock('../../electron/main/services/log/logger.service.js', () => ({
  loggerService: {
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

vi.mock('../../electron/main/services/settings.service.js', () => ({
  settingsService: {
    loadConfig: vi.fn(async () => ({
      noteStorage: {
        snapshotInterval: 10,
        maxHistoryVersions: 0,
        autoClearTrashDays: 0,
      },
    })),
  },
}));

vi.mock('../../electron/main/services/history.service.js', () => ({
  historyService: {
    saveVersion: vi.fn(),
    getVersions: vi.fn(async () => []),
    getVersionContent: vi.fn(),
  },
}));

vi.mock('../../electron/main/utils/i18n.js', () => ({
  $t: (_key: string, fallback = '') => fallback,
}));

import {
  extractMarkdownImageReferences,
} from '../../electron/main/utils/markdown.utils';
import {
  NOTE_IMAGE_MAX_BYTES,
  NOTE_IMAGE_UNAVAILABLE_REASONS,
  NoteImageAccessError,
  vfsService,
} from '../../electron/main/services/vfs.service';

const PNG_DATA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_DATA = Buffer.from('RIFF1234WEBP', 'ascii');

function getContentId(note: { contentId?: string }): string {
  if (!note.contentId) throw new Error('Test note does not have contentId');
  return note.contentId;
}

describe('Markdown image discovery', () => {
  it('preserves document order and parses titles and angle-bracket destinations', () => {
    const references = extractMarkdownImageReferences([
      '![first](../images/id/first.png "title")',
      'text ![second](<../images/id/image with spaces.jpg> "other")',
    ].join('\n'));

    expect(references).toEqual([
      expect.objectContaining({
        imageIndex: 0,
        altText: 'first',
        destination: '../images/id/first.png',
      }),
      expect.objectContaining({
        imageIndex: 1,
        altText: 'second',
        destination: '../images/id/image with spaces.jpg',
      }),
    ]);
  });
});

describe('VFS note image access', () => {
  let workspaceRoot = '';

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'snaptium-note-image-'));
    await vfsService.initializeWorkspace(workspaceRoot);
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  async function createNoteWithMarkdown(markdown: string): Promise<{
    noteId: string;
    contentId: string;
    imageDirectory: string;
  }> {
    const note = await vfsService.createFile(null, 'Image note', markdown);
    const contentId = getContentId(note);
    const imageDirectory = path.join(workspaceRoot, 'Database', 'images', contentId);
    await fs.mkdir(imageDirectory, { recursive: true });
    return { noteId: note.id, contentId, imageDirectory };
  }

  async function replaceNoteMarkdown(contentId: string, markdown: string): Promise<void> {
    await fs.writeFile(
      path.join(workspaceRoot, 'Database', 'objects', `${contentId}.md`),
      markdown,
      'utf8',
    );
  }

  it('returns an empty manifest for a text-only note', async () => {
    const { noteId } = await createNoteWithMarkdown('# Text only');

    await expect(vfsService.getNoteImageManifest(noteId)).resolves.toEqual([]);
  });

  it('returns safe ordered availability metadata without filesystem paths', async () => {
    const note = await createNoteWithMarkdown('placeholder');
    const validImagePath = path.join(note.imageDirectory, 'valid.png');
    const oversizedImagePath = path.join(note.imageDirectory, 'oversized.jpg');
    const folderPath = path.join(note.imageDirectory, 'folder.png');
    await fs.writeFile(validImagePath, PNG_DATA);
    await fs.writeFile(path.join(note.imageDirectory, 'unsupported.svg'), '<svg/>', 'utf8');
    await fs.writeFile(path.join(note.imageDirectory, 'fake.png'), 'not an image', 'utf8');
    await fs.writeFile(oversizedImagePath, Buffer.alloc(1));
    await fs.truncate(oversizedImagePath, NOTE_IMAGE_MAX_BYTES + 1);
    await fs.mkdir(folderPath);
    await replaceNoteMarkdown(note.contentId, [
      `![valid](../images/${note.contentId}/valid.png)`,
      '![remote](https://example.com/remote.png)',
      '![outside](../objects/secret.png)',
      `![missing](../images/${note.contentId}/missing.webp)`,
      `![unsupported](../images/${note.contentId}/unsupported.svg)`,
      `![fake](../images/${note.contentId}/fake.png)`,
      `![large](../images/${note.contentId}/oversized.jpg)`,
      `![folder](../images/${note.contentId}/folder.png)`,
    ].join('\n'));

    const manifest = await vfsService.getNoteImageManifest(note.noteId);

    expect(manifest.map((entry) => ({
      imageIndex: entry.imageIndex,
      available: entry.available,
      reason: entry.unavailableReason,
    }))).toEqual([
      { imageIndex: 0, available: true, reason: undefined },
      { imageIndex: 1, available: false, reason: NOTE_IMAGE_UNAVAILABLE_REASONS.EXTERNAL },
      { imageIndex: 2, available: false, reason: NOTE_IMAGE_UNAVAILABLE_REASONS.OUTSIDE_NOTE_IMAGES },
      { imageIndex: 3, available: false, reason: NOTE_IMAGE_UNAVAILABLE_REASONS.MISSING },
      { imageIndex: 4, available: false, reason: NOTE_IMAGE_UNAVAILABLE_REASONS.UNSUPPORTED_TYPE },
      { imageIndex: 5, available: false, reason: NOTE_IMAGE_UNAVAILABLE_REASONS.UNSUPPORTED_TYPE },
      { imageIndex: 6, available: false, reason: NOTE_IMAGE_UNAVAILABLE_REASONS.TOO_LARGE },
      { imageIndex: 7, available: false, reason: NOTE_IMAGE_UNAVAILABLE_REASONS.NOT_FILE },
    ]);
    expect(JSON.stringify(manifest)).not.toContain(workspaceRoot);
    expect(JSON.stringify(manifest)).not.toContain('base64');
  });

  it('rejects an image whose real path escapes through a symbolic link', async () => {
    const note = await createNoteWithMarkdown('placeholder');
    const outsideDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'snaptium-note-image-outside-'));
    try {
      await fs.writeFile(path.join(outsideDirectory, 'outside.png'), PNG_DATA);
      await fs.symlink(
        outsideDirectory,
        path.join(note.imageDirectory, 'linked'),
        process.platform === 'win32' ? 'junction' : 'dir',
      );
      await replaceNoteMarkdown(
        note.contentId,
        `![linked](../images/${note.contentId}/linked/outside.png)`,
      );

      const [entry] = await vfsService.getNoteImageManifest(note.noteId);
      expect(entry).toMatchObject({
        available: false,
        unavailableReason: NOTE_IMAGE_UNAVAILABLE_REASONS.OUTSIDE_NOTE_IMAGES,
      });
      await expect(vfsService.readNoteImage(note.noteId, 0)).rejects.toMatchObject({
        reason: NOTE_IMAGE_UNAVAILABLE_REASONS.OUTSIDE_NOTE_IMAGES,
      });
    } finally {
      await fs.rm(outsideDirectory, { recursive: true, force: true });
    }
  });

  it('reparses current Markdown and rejects a changed image index', async () => {
    const note = await createNoteWithMarkdown('placeholder');
    await fs.writeFile(path.join(note.imageDirectory, 'first.png'), PNG_DATA);
    await replaceNoteMarkdown(
      note.contentId,
      `![first](../images/${note.contentId}/first.png)`,
    );
    await expect(vfsService.getNoteImageManifest(note.noteId)).resolves.toHaveLength(1);

    await replaceNoteMarkdown(note.contentId, '# Image removed');

    await expect(vfsService.readNoteImage(note.noteId, 0)).rejects.toBeInstanceOf(NoteImageAccessError);
    await expect(vfsService.readNoteImage(note.noteId, 0)).rejects.toMatchObject({
      reason: 'image-index-changed',
    });
  });

  it('loads bytes only for an available supported image', async () => {
    const note = await createNoteWithMarkdown('placeholder');
    const data = WEBP_DATA;
    await fs.writeFile(path.join(note.imageDirectory, 'scan.webp'), data);
    await replaceNoteMarkdown(
      note.contentId,
      `![scan](../images/${note.contentId}/scan.webp)`,
    );

    await expect(vfsService.readNoteImage(note.noteId, 0)).resolves.toMatchObject({
      noteId: note.noteId,
      imageIndex: 0,
      altText: 'scan',
      mediaType: 'image/webp',
      byteSize: data.length,
      data,
    });
  });
});
