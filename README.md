# Vimlypond

A Vim-style modal music notation editor with VexFlow rendering and LilyPond export.

## Features

### Modal Editing
- **Normal Mode** - Navigate and manipulate music notation
- **Insert Mode** - Input notes and rests with intelligent pitch inference

### Note Input & Editing
| Key | Action |
|-----|--------|
| `a-g` | Insert note (A-G) |
| `r` | Insert rest |
| `1,2,4,8,16` | Set duration (whole, half, quarter, eighth, sixteenth) |
| `.` | Add dot (augmentation dot) |
| `+/-` | Add sharp/flat |
| `'/,` | Raise/lower octave |
| `Shift+a-g` | Add pitch to current note (chord input) |

### Navigation
| Key | Action |
|-----|--------|
| `h/l` | Move left/right within measure |
| `j/k` | Move between staves |
| `n/b` | Move to next/previous measure |

### Score Operations
| Key | Action |
|-----|--------|
| `o/O` | Add staff below/above |
| `t` | Toggle clef (treble/bass) |
| `Shift+K` | Key signature selector |
| `Shift+M` | Time signature selector |
| `x` | Delete element |
| `u` | Undo |
| `Ctrl+R` | Redo |
| `.` | Repeat last action |

### Advanced Features
- **Chord Input** - Add multiple pitches to a single note position
- **Key Signatures** - Support for all major and minor keys (15+15)
- **Time Signatures** - Common meters (2/4, 3/4, 4/4, 6/8, etc.)
- **Cross-measure Ties** - Automatic tie rendering across barlines
- **Stream Balancing** - Intelligent measure overflow/underflow handling
- **Multi-staff Support** - Piano scores, orchestral layouts
- **LilyPond Export** - Generate `.ly` files for professional engraving

### UI/UX
- Real-time VexFlow rendering
- Input preview in status bar
- Context-aware help panel (`?` key)
- Bilingual interface (中文/English)
- LocalStorage persistence

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run tests
bun run test
```

## Project Structure

```
src/lib/vimlypond/
├── store.ts          # Zustand state management
├── music.ts          # Music theory & LilyPond export
├── renderer.ts       # VexFlow rendering engine
├── types.ts          # TypeScript definitions
├── i18n.ts           # Internationalization
└── *.test.ts         # Test files

src/components/vimlypond/
└── VimlypondEditor.tsx  # Main editor component
```

## Technology Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **VexFlow** - Music notation rendering
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Development

See [开发规范.md](./开发规范.md) for:
- PR development workflow
- Version numbering conventions
- Commit message guidelines

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## License

MIT
