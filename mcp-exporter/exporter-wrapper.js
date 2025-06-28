import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a require function for CommonJS modules
const require = createRequire(import.meta.url);

// Import the CommonJS module
const ClaudePromptExporter = require(join(__dirname, '..', 'lib', 'index.js'));

export default ClaudePromptExporter;