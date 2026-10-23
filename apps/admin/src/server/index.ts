import app from './app';
import config from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Chairly API server listening on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`⏰ Default Timezone: ${config.defaultTimezone}`);
});
