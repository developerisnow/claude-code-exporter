import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  aggregation: {
    enabled: process.env.AGGREGATION_ENABLED === 'true',
    outputPath: process.env.AGGREGATION_OUTPUT_PATH || './aggregated',
    schedule: process.env.AGGREGATION_SCHEDULE || '*/5 * * * *', // Every 5 minutes
  },

  claude: {
    homePath: process.env.CLAUDE_HOME,
  },
}));
