const amqp = require("amqplib");
const message = "hello, rabbitMQ for js";

const runProducer = async () => {
  try {
    const connect = await amqp.connect("amqp://localhost");
    const channel = await connect.createChannel();
    const queueName = "test-topic";
    await channel.assertQueue(queueName, { durable: true });

    // send message to consumer channel
    channel.sendToQueue(queueName, Buffer.from(message));
    console.log("message sent", message);
    setTimeout(() => {
      connect.close();
      process.exit();
    }, 500);
  } catch (error) {
    console.error(error);
  }
};

runProducer().catch(console.error());
