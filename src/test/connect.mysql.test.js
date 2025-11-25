const mysql = require("mysql2");

// create connect to pool server

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "baobui",
  database: "MYSQL8_MASTER",
});

const batchSize = 10; // adjust batch size
const totalSize = 10000; // adjust total size

let currentId = 1;
console.time(":::::::::TIMER:::::::");
const insertBatch = async () => {
  const values = [];
  for (let i = 0; i < batchSize && currentId <= totalSize; i++) {
    const name = `name-${currentId}`;
    const age = currentId;
    const address = `address-${currentId}`;
    values.push([currentId, name, age, address]);
    currentId++;
  }

  if (!values.length) {
    console.timeEnd(":::::::::TIMER:::::::");
    pool.end((err) => {
      if (err) {
        console.log("error occurend while running batch");
      } else {
        console.log("Connection pool closed successfully");
      }
    });
    return;
  }

  const sql = `INSERT INTO test_table (id, name, age, address) VALUES ?`;

  pool.query(sql, [values], async function (err, results) {
    if (err) throw err;

    console.log(`Inserted ${results.affectedRows} records`);

    await insertBatch();
  });
};

insertBatch().catch(console.error);

// pool.query("SELECT * from users", function (err, results) {
//   if (err) throw err;

//   console.log("query results: ", results);

//   // close pool connection
//   pool.end((err) => {
//     if (err) throw err;
//     console.log("connection closed:");
//   });
// });
