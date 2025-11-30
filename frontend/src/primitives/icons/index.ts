/**
 * Brutalist Icon System
 *
 * A minimal set of aggressive, geometric icons.
 * Reuse through context - fewer icons, more meaning.
 */

export { Icon, type IconProps } from './Icon';

// Core symbols
export { Cross } from './Cross';     // ✕ Close, Delete, Error, No
export { Tick } from './Tick';       // ✓ Success, Confirm, Yes
export { Bang } from './Bang';       // ! Warning, Alert
export { Skull } from './Skull';     // ☠ Danger, Fatal

// Actions
export { Play } from './Play';       // ▶ Play, Start, Go
export { Stop } from './Stop';       // ■ Stop, Pause, End
export { Plus } from './Plus';       // + Add, Create, New
export { Minus } from './Minus';     // − Remove, Collapse

// Navigation
export { Arrow } from './Arrow';     // → Direction (use rotate prop)
export { Target } from './Target';   // ⌖ Search, Find
export { Bars } from './Bars';       // ☰ Menu, List view toggle
export { GridIcon } from './Grid';   // ▦ Grid view

// Media
export { Layers } from './Layers';   // ≡ Subtitle tracks, stacked items
export { File } from './File';       // 📄 File, document
export { TV } from './TV';           // 📺 TV shows, series
export { Film } from './Film';       // 🎬 Movies, films

// Brand
export { Logo } from './Logo';       // PLEX DUALSUB brand mark

// States
export { Dot } from './Dot';         // ● Bullet, separator, status
export { HalfDot } from './HalfDot'; // ◐ Partial, in-progress
export { EyeOpen } from './EyeOpen';     // 👁 Light mode (awake)
export { EyeClosed } from './EyeClosed'; // 😴 Dark mode (asleep)
