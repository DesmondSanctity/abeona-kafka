import express from 'express';
import dotenv from 'dotenv';
import { Kafka, logLevel } from 'kafkajs';
import mongoose from 'mongoose';

dotenv.config({ path: '.env' });

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

const consumer = kafka.consumer({ groupId: 'user_group' });

const isConsuming = async () => {
 try {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('Connected to MongoDB');

  const User = mongoose.model('user', {
   name: String,
   email: String,
   password: String,
  });

  await consumer.connect();
  console.log('Connected to Kafka');

  await consumer.subscribe({
   topic: process.env.KAFKA_TOPIC,
   fromBeginning: true,
  });
  console.log(`Subscribed to topic ${process.env.KAFKA_TOPIC}`);

  await consumer.run({
   eachMessage: async ({ message }) => {
    try {
     console.log('Received message:', message);
     if (message.value === undefined) {
      console.error('Message value is undefined');
      return;
     }

     const userData = JSON.parse(message.value.toString());
     console.log('Parsed user data:', userData);

     const user = new User(userData);
     await user.save();
     console.log('User saved to MongoDB');
    } catch (error) {
     console.error('Error processing message:', error);
    }
   },
  });
 } catch (error) {
  console.error('Error in isConsuming:', error);
 }
};

isConsuming();

app.listen(process.env.PORTB, () => {
 console.log('App B running on port', process.env.PORTB);
});
