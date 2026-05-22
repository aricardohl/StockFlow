const amqplib = require('amqplib');

let connection = null;
let channel = null;

async function connectRabbitMQ() {
  const url = process.env.RABBITMQ_URL;
  try {
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
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

function getChannel() {
  return channel;
}

function getConnection() {
  return connection;
}

module.exports = { connectRabbitMQ, getChannel, getConnection };
