import { apiApp } from './app.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

async function bootstrap() {
  await connectDb();
  await connectRedis();

  const server = apiApp.listen(config.PORT_API, () => {
    logger.info({ port: config.PORT_API }, `Mizan Management API server listening on port ${config.PORT_API}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Graceful shutdown initiated for Management API');
    server.close(async () => {
      await disconnectDb();
      await disconnectRedis();
      logger.info('Management API successfully shut down');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forcefully terminating Management API due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal error booting Management API');
  process.exit(1);
});
