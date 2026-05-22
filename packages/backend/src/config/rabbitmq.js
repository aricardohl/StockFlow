const amqplib = require('amqplib');

let connection = null;
let channel = null;

async function connectRabbitMQ({ retries = 5, initialDelay = 2000 } = {}) {
  const url = process.env.RABBITMQ_URL;
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < retries) {
    try {
      attempt += 1;
      connection = await amqplib.connect(url);
      channel = await connection.createChannel();
      await channel.assertQueue(process.env.RABBITMQ_QUEUE_MOVEMENTS, { durable: true });
      console.log('RabbitMQ connected to', url);

      // Graceful shutdown
      process.once('exit', async () => {
        try {
          if (channel) await channel.close();
          if (connection) await connection.close();
        } catch (e) {
          // ignore
        }
      });

      return { connection, channel };
    } catch (error) {
      const code = error && error.code ? error.code : null;
      console.warn(`[RabbitMQ] connect attempt ${attempt}/${retries} failed (${code || error.message}).`);
      if (attempt >= retries) {
        console.error('[RabbitMQ] All connection attempts failed. Giving up for now.');
        return null;
      }
      // exponential backoff
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }
  return null;
}

function getChannel() {
  return channel;
}

function getConnection() {
  return connection;
}

module.exports = { connectRabbitMQ, getChannel, getConnection };
