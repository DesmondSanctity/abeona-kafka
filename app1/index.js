import express from 'express';
import dotenv from 'dotenv';
import { Kafka, logLevel } from 'kafkajs';

dotenv.config();

const app = express();
app.use(express.json());

const kafka = new Kafka({
 brokers: [process.env.KAFKA_SERVER],
 ssl: true,
 sasl: {
  mechanism: 'scram-sha-256',
  username: process.env.KAFKA_USER,
  password: process.env.KAFKA_PASS,
 },
 logLevel: logLevel.ERROR,
});

const producer = kafka.producer();

const isProducing = async () => {
 await producer.connect();
 console.log('Producer connected to Kafka');

 app.post('/', async (req, res) => {
  try {
   const message = JSON.stringify(req.body);
   await producer.send({
    topic: process.env.KAFKA_TOPIC,
    messages: [{ value: message }], // Corrected this line
   });
   res.status(200).send('Message sent to Kafka');
  } catch (error) {
   console.error('Error sending message to Kafka:', error);
   res.status(500).send('Error sending message to Kafka');
  }
 });

 // Do not disconnect the producer here, as it should stay connected while the app is running
 // await producer.disconnect();
};

isProducing();

app.listen(process.env.PORTA, () => {
 console.log('App A running on port', process.env.PORTA);
});
