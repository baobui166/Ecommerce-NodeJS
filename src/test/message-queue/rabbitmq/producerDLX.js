const amqp = require("amqplib");
const message = "hello, rabbitMQ for js";

const runProducer = async () => {
  try {
    const connect = await amqp.connect("amqp://localhost");
    const channel = await connect.createChannel();

    const notificationExchange = "notificationEx";
    const notiQueue = "notificationQueueProcess";
    const notificationExchangeDLX = "notificationExDLX";
    const notificationRoutingKeyDLX = "notificationRoutingKeyDLX";

    // 1.  create Exchange
    await channel.assertExchange(notificationExchange, "direct", {
      durable: true,
    });

    // 2. create queue
    const queueResult = await channel.assertQueue(notiQueue, {
      exclusive: false, // cho phep truy cap vao hang doi cung 1 luc
      deadLetterExchange: notificationExchangeDLX,
      deadLetterRoutingKey: notificationRoutingKeyDLX,
    });

    // 3. bind queue
    await channel.bindQueue(queueResult.queue, notificationExchange);

    //4. send message
    const message = "a new product";
    console.log(`Producer msg::`, message);
    await channel.sendToQueue(queueResult.queue, Buffer.from(message), {
      expiration: 10000,
    });

    setTimeout(() => {
      connect.close();
      process.exit();
    }, 500);
  } catch (error) {
    console.error(error);
  }
};

runProducer().catch(console.error());
