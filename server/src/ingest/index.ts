import { ingestApp } from './app.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

async function bootstrap() {
  await connectDb();
  await connectRedis();

  const server = ingestApp.listen(config.PORT_INGEST, () => {
    logger.info({ port: config.PORT_INGEST }, `Mizan High-Volume Ingestion API listening on port ${config.PORT_INGEST}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Graceful shutdown initiated for Ingestion API');
    server.close(async () => {
      await disconnectDb();
      await disconnectRedis();
      logger.info('Ingestion API successfully shut down');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forcefully terminating Ingestion API due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal error booting Ingestion API');
  process.exit(1);
});
