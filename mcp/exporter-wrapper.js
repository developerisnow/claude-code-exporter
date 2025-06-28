// ES Module wrapper for CommonJS exporter
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ClaudePromptExporter = require('../lib/index.js');

export default ClaudePromptExporter;