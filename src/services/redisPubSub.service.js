const Redis = require("redis");
const { getRedis } = require("../dbs/init.redis");

class RedisPubSubService {
  constructor() {
    const { instanceConnect } = getRedis();
    this.subscriber = instanceConnect;
    this.publisher = instanceConnect;
  }

  publish(channel, message) {
    return new Promise((resolve, reject) => {
      this.publisher.publish(channel, message, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  subscribe(channel, callback) {
    this.subscriber.subscribe(channel);
    this.subscriber.on("message", (subscriberChannel, message) => {
      if (channel === subscriberChannel) {
        callback(channel, message);
      }
    });
  }
}
module.exports = new RedisPubSubService();
