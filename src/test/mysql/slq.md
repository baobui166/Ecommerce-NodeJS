// create table

CREATE TABLE test_table (
id int NOT NULL,
name varchar(255) DEFAULT NULL,
aeg int DEFAULT NULL,
PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

// createp procedure

CREATE DEFINER=`baobui`@`%` PROCEDURE `insert_data`()
BEGIN
DECLARE max_id INT DEFAULT 1000000;
DECLARE i INT DEFAULT 1;
WHILE i<= max_id DO
INSERT INTO test_table (id, name, age, address) VALUES (i, CONCAT('Name', i), i%100, CONCAT('Address', i));
SET i = i + 1;
END WHILE;
END
