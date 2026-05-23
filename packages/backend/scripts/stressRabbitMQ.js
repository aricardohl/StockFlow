// scripts/stress.js
require('dotenv').config();
const amqplib = require('amqplib');

const QUEUE = process.env.RABBITMQ_QUEUE_MOVEMENTS;
const TOTAL_MESSAGES = 100; // cuántos mensajes mandar

// Usa un movementId que SÍ exista en tu DB
const MOVEMENT_ID = '000000000000000000000301';

async function main() {
  const conn = await amqplib.connect(process.env.RABBITMQ_URL);
  const ch   = await conn.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });

  console.log(`Publicando ${TOTAL_MESSAGES} mensajes en "${QUEUE}"...`);

  for (let i = 0; i < TOTAL_MESSAGES; i++) {
    ch.sendToQueue(
      QUEUE,
      Buffer.from(JSON.stringify({ movementId: MOVEMENT_ID, attempts: 0 })),
      { persistent: true }
    );
  }

  console.log('Listo. Revisa http://localhost:15672');
  await ch.close();
  await conn.close();
}

main().catch(console.error);