# EPUB Parser Modules

This directory contains a modularized version of the SimpleEpubParser, broken down into focused, maintainable components.

## Module Structure

### Core Modules

#### `CoreEpubParser.js`
- **Purpose**: Core EPUB parsing functionality
- **Features**:
  - EPUB file loading from URLs
  - Metadata extraction (title, author, chapters)
  - Chapter content extraction
  - Content cleaning and processing
  - Word counting for blank page detection

#### `HtmlGenerator.js`
- **Purpose**: HTML generation and styling
- **Features**:
  - Word wrapping in spans for individual targeting
  - Enhanced HTML generation with premium design
  - CSS styling and responsive design
  - Blank page HTML generation
  - Navigation and notification HTML

#### `WordTracker.js`
- **Purpose**: Word-level tracking and interactions
- **Features**:
  - Word initialization and tracking
  - Bookmark creation and management
  - Word positioning calculations
  - Navigation between words
  - Text selection handling

#### `BookmarkSystem.js`
- **Purpose**: Bookmark management system
- **Features**:
  - Bookmark creation and removal
  - Bookmark navigation (next/previous)
  - Bookmark positioning
  - Message handling for bookmark operations
  - Chapter index management

#### `RobotFeatures.js`
- **Purpose**: AI-powered features and robot mode
- **Features**:
  - Robot mode toggle
  - Text selection for AI processing
  - Meaning popup management
  - Action button creation and positioning
  - AI message handling

### Main Parser

#### `SimpleEpubParser.js`
- **Purpose**: Main parser class that combines all modules
- **Features**:
  - Exposes all functionality from individual modules
  - Maintains backward compatibility
  - Provides unified API
  - Manages module interactions

## Usage

### Basic Usage (Backward Compatible)
```javascript
import SimpleEpubParser from './utils/epub/SimpleEpubParser.js';

const parser = new SimpleEpubParser();
await parser.loadEpubFromUrl('https://example.com/book.epub');
const content = await parser.getChapterContent(0);
```

### Modular Usage
```javascript
import { CoreEpubParser, HtmlGenerator, WordTracker } from './utils/epub/index.js';

const coreParser = new CoreEpubParser();
const htmlGenerator = new HtmlGenerator();
const wordTracker = new WordTracker();

// Use individual modules as needed
```

### Specific Module Usage
```javascript
import { BookmarkSystem } from './utils/epub/BookmarkSystem.js';

const bookmarkSystem = new BookmarkSystem();
bookmarkSystem.toggleBookmarkMode();
```

## Benefits of Modularization

### 1. **Maintainability**
- Each module has a single responsibility
- Easier to debug and fix issues
- Clear separation of concerns

### 2. **Reusability**
- Individual modules can be used independently
- Mix and match functionality as needed
- Easier to test individual components

### 3. **Scalability**
- Add new features without affecting existing code
- Easy to extend specific functionality
- Better code organization

### 4. **Performance**
- Load only the modules you need
- Smaller bundle sizes for specific use cases
- Better tree-shaking support

## Module Dependencies

```
SimpleEpubParser
├── CoreEpubParser (base functionality)
├── HtmlGenerator (HTML generation)
├── WordTracker (word interactions)
├── BookmarkSystem (bookmark management)
└── RobotFeatures (AI features)
```

## File Structure

```
utils/epub/
├── CoreEpubParser.js      # Core parsing functionality
├── HtmlGenerator.js       # HTML generation and styling
├── WordTracker.js         # Word tracking and interactions
├── BookmarkSystem.js      # Bookmark management
├── RobotFeatures.js       # AI/robot features
├── SimpleEpubParser.js    # Main parser class
├── index.js              # Module exports
└── README.md             # This documentation
```

## Migration Guide

### From Original SimpleEpubParser.js

**Before:**
```javascript
import SimpleEpubParser from './utils/SimpleEpubParser.js';
```

**After:**
```javascript
import SimpleEpubParser from './utils/epub/SimpleEpubParser.js';
// or
import { SimpleEpubParser } from './utils/epub/index.js';
```

### Using Specific Modules

**Before:**
```javascript
const parser = new SimpleEpubParser();
// All functionality in one class
```

**After:**
```javascript
import { BookmarkSystem, RobotFeatures } from './utils/epub/index.js';

const bookmarkSystem = new BookmarkSystem();
const robotFeatures = new RobotFeatures();
// Use specific functionality as needed
```

## Development

### Adding New Features

1. **Create a new module** in the `utils/epub/` directory
2. **Export the module** in `index.js`
3. **Import and use** in `SimpleEpubParser.js` if needed
4. **Update documentation** in this README

### Modifying Existing Features

1. **Locate the relevant module**
2. **Make changes** to the specific module
3. **Test the module** independently
4. **Update the main parser** if needed

### Testing

Each module can be tested independently:

```javascript
import { WordTracker } from './utils/epub/WordTracker.js';

const wordTracker = new WordTracker();
// Test word tracking functionality
```

## Performance Considerations

- **Lazy Loading**: Modules are only loaded when needed
- **Tree Shaking**: Unused modules can be eliminated during build
- **Bundle Size**: Smaller bundles for specific use cases
- **Memory Usage**: Better memory management with focused modules

## Browser Compatibility

All modules maintain the same browser compatibility as the original parser:
- Modern browsers with ES6+ support
- React Native environments
- Node.js environments (with appropriate polyfills)

## Future Enhancements

The modular structure makes it easy to add:
- **New AI features** in `RobotFeatures.js`
- **Enhanced bookmarking** in `BookmarkSystem.js`
- **Better HTML generation** in `HtmlGenerator.js`
- **Advanced word tracking** in `WordTracker.js`
- **Core parsing improvements** in `CoreEpubParser.js`
