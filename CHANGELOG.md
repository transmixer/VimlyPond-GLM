All notable changes to Vimlypond will be documented in this file.

## [v0.12.0] - 2026-07-22

### Changed (Architecture Refactoring)

- **Extend MeasureElement to tagged union type**
  - Now supports `note | rest | barline` and can be easily extended for more element types in the future
  - `Note` now has built-in fields for future features: `tuplet`, `dynamics`, `articulation`, `ornament`
  - `Measure` added `barlineLeft`, `barlineRight`, `repeat` fields for barline types and repeat signs
  - Duration calculation now correctly skips non-note/rest elements

- **Added serialization versioning with migration**
  - `Score` now has a `version` field for schema migrations
  - Automatic migration from older versions stored in LocalStorage
  - Guarantees backward compatibility as features evolve

- **Introduced Command pattern abstraction**
  - Added `Command` interface in `types.ts`
  - Added `executeCommand` method to store for executing commands
  - Sets foundation for easier extension, macro recording, and better testability

### Compatibility
- All existing functionality remains unchanged
- Full backward compatibility with existing data
- TypeScript compiled successfully

