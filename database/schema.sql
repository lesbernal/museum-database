CREATE DATABASE  IF NOT EXISTS `museum` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `museum`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: museum
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `artist`
--

DROP TABLE IF EXISTS `artist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artist` (
  `artist_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `birth_year` int NOT NULL,
  `death_year` int NOT NULL,
  `nationality` varchar(100) NOT NULL,
  `biography` text NOT NULL,
  PRIMARY KEY (`artist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artwork`
--

DROP TABLE IF EXISTS `artwork`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artwork` (
  `artwork_id` int NOT NULL,
  `artist_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `creation_year` int NOT NULL,
  `medium` varchar(100) NOT NULL,
  `dimensions` varchar(100) NOT NULL,
  `acquisition_date` date NOT NULL,
  `insurance_value` decimal(15,2) NOT NULL,
  `current_display_status` enum('On Display','In Storage','On Loan','Under Restoration') NOT NULL,
  PRIMARY KEY (`artwork_id`),
  KEY `artist_id` (`artist_id`),
  CONSTRAINT `artwork_ibfk_1` FOREIGN KEY (`artist_id`) REFERENCES `artist` (`artist_id`),
  CONSTRAINT `artwork_chk_1` CHECK ((`insurance_value` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cafeitem`
--

DROP TABLE IF EXISTS `cafeitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cafeitem` (
  `item_id` int NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `cafeitem_chk_1` CHECK ((`price` >= 0)),
  CONSTRAINT `cafeitem_chk_2` CHECK ((`stock_quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cafetransaction`
--

DROP TABLE IF EXISTS `cafetransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cafetransaction` (
  `cafe_transaction_id` int NOT NULL,
  `user_id` int NOT NULL,
  `transaction_datetime` datetime NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  PRIMARY KEY (`cafe_transaction_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `cafetransaction_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `cafetransaction_chk_1` CHECK ((`total_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cafetransactionitem`
--

DROP TABLE IF EXISTS `cafetransactionitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cafetransactionitem` (
  `transaction_item_id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`transaction_item_id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `cafetransactionitem_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `cafetransaction` (`cafe_transaction_id`),
  CONSTRAINT `cafetransactionitem_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `cafeitem` (`item_id`),
  CONSTRAINT `cafetransactionitem_chk_1` CHECK ((`quantity` > 0)),
  CONSTRAINT `cafetransactionitem_chk_2` CHECK ((`subtotal` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `department`
--

DROP TABLE IF EXISTS `department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department` (
  `department_id` int NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `budget` decimal(15,2) NOT NULL,
  `phone_extension` varchar(10) NOT NULL,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `department_name` (`department_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `donation`
--

DROP TABLE IF EXISTS `donation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation` (
  `donation_id` int NOT NULL,
  `user_id` int NOT NULL,
  `donation_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `donation_type` varchar(50) NOT NULL,
  PRIMARY KEY (`donation_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `donation_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `donation_chk_1` CHECK ((`amount` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `user_id` int NOT NULL,
  `department_id` int NOT NULL,
  `job_title` varchar(100) NOT NULL,
  `hire_date` date NOT NULL,
  `salary` decimal(15,2) NOT NULL,
  `employment_type` varchar(50) NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event`
--

DROP TABLE IF EXISTS `event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event` (
  `event_id` int NOT NULL,
  `gallery_id` int NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `event_date` date NOT NULL,
  `capacity` int NOT NULL,
  `member_only` tinyint(1) NOT NULL,
  `total_attendees` int NOT NULL,
  PRIMARY KEY (`event_id`),
  KEY `gallery_id` (`gallery_id`),
  CONSTRAINT `event_ibfk_1` FOREIGN KEY (`gallery_id`) REFERENCES `gallery` (`gallery_id`),
  CONSTRAINT `event_chk_1` CHECK ((`capacity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exhibition`
--

DROP TABLE IF EXISTS `exhibition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exhibition` (
  `exhibition_id` int NOT NULL,
  `gallery_id` int NOT NULL,
  `exhibition_name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `exhibition_type` enum('Permanent','Temporary','Traveling') NOT NULL,
  PRIMARY KEY (`exhibition_id`),
  KEY `gallery_id` (`gallery_id`),
  CONSTRAINT `exhibition_ibfk_1` FOREIGN KEY (`gallery_id`) REFERENCES `gallery` (`gallery_id`),
  CONSTRAINT `exhibition_chk_1` CHECK ((`end_date` > `start_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exhibitionartwork`
--

DROP TABLE IF EXISTS `exhibitionartwork`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exhibitionartwork` (
  `exhibition_id` int NOT NULL,
  `artwork_id` int NOT NULL,
  `display_start_date` date NOT NULL,
  `display_end_date` date NOT NULL,
  PRIMARY KEY (`exhibition_id`,`artwork_id`),
  KEY `artwork_id` (`artwork_id`),
  CONSTRAINT `exhibitionartwork_ibfk_1` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibition` (`exhibition_id`),
  CONSTRAINT `exhibitionartwork_ibfk_2` FOREIGN KEY (`artwork_id`) REFERENCES `artwork` (`artwork_id`),
  CONSTRAINT `exhibitionartwork_chk_1` CHECK ((`display_end_date` > `display_start_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gallery`
--

DROP TABLE IF EXISTS `gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery` (
  `gallery_id` int NOT NULL,
  `building_id` int NOT NULL,
  `gallery_name` varchar(255) NOT NULL,
  `floor_number` int NOT NULL,
  `square_footage` int NOT NULL,
  `climate_controlled` tinyint(1) NOT NULL,
  PRIMARY KEY (`gallery_id`),
  KEY `building_id` (`building_id`),
  CONSTRAINT `gallery_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `museumbuilding` (`building_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `giftshopitem`
--

DROP TABLE IF EXISTS `giftshopitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giftshopitem` (
  `item_id` int NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `giftshopitem_chk_1` CHECK ((`price` >= 0)),
  CONSTRAINT `giftshopitem_chk_2` CHECK ((`stock_quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `giftshoptransaction`
--

DROP TABLE IF EXISTS `giftshoptransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giftshoptransaction` (
  `transaction_id` int NOT NULL,
  `user_id` int NOT NULL,
  `transaction_datetime` datetime NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  PRIMARY KEY (`transaction_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `giftshoptransaction_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `giftshoptransaction_chk_1` CHECK ((`total_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `giftshoptransactionitem`
--

DROP TABLE IF EXISTS `giftshoptransactionitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giftshoptransactionitem` (
  `shop_item_id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`shop_item_id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `giftshoptransactionitem_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `giftshoptransaction` (`transaction_id`),
  CONSTRAINT `giftshoptransactionitem_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `giftshopitem` (`item_id`),
  CONSTRAINT `giftshoptransactionitem_chk_1` CHECK ((`quantity` > 0)),
  CONSTRAINT `giftshoptransactionitem_chk_2` CHECK ((`subtotal` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `member`
--

DROP TABLE IF EXISTS `member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `user_id` int NOT NULL,
  `membership_level` varchar(50) NOT NULL,
  `join_date` date NOT NULL,
  `expiration_date` date NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `member_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `visitor` (`user_id`),
  CONSTRAINT `member_chk_1` CHECK ((`expiration_date` > `join_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `membershipstransaction`
--

DROP TABLE IF EXISTS `membershiptransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membershiptransaction` (
  `transaction_id`   int NOT NULL AUTO_INCREMENT,
  `user_id`          int NOT NULL,
  `membership_level` varchar(50) NOT NULL,
  `transaction_date` datetime NOT NULL,
  `amount`           decimal(10,2) NOT NULL,
  `payment_method`   varchar(50) NOT NULL,
  `transaction_type` enum('New','Renewal','Upgrade') NOT NULL DEFAULT 'New',
  PRIMARY KEY (`transaction_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `membershiptransaction_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `membershiptransaction_chk_1` CHECK ((`amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `museumbuilding`
--

DROP TABLE IF EXISTS `museumbuilding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `museumbuilding` (
  `building_id` int NOT NULL,
  `building_name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `square_footage` int NOT NULL,
  `visitor_capacity` int NOT NULL,
  PRIMARY KEY (`building_id`),
  UNIQUE KEY `building_name` (`building_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `provenance`
--

DROP TABLE IF EXISTS `provenance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provenance` (
  `provenance_id` int NOT NULL,
  `artwork_id` int NOT NULL,
  `owner_name` varchar(255) NOT NULL,
  `acquisition_date` date NOT NULL,
  `acquisition_method` varchar(50) NOT NULL,
  `price_paid` decimal(15,2) NOT NULL,
  `transfer_date` date NOT NULL,
  PRIMARY KEY (`provenance_id`),
  KEY `artwork_id` (`artwork_id`),
  CONSTRAINT `provenance_ibfk_1` FOREIGN KEY (`artwork_id`) REFERENCES `artwork` (`artwork_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket` (
  `ticket_id` int NOT NULL,
  `user_id` int NOT NULL,
  `purchase_date` date NOT NULL,
  `visit_date` date NOT NULL,
  `ticket_type` enum('Adult 19+','Senior 65+','Youth 13-18','Child 12 & Under') NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `discount_type` enum('None','Student','Military','Member') NOT NULL,
  `final_price` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  PRIMARY KEY (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ticket_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `ticket_chk_1` CHECK ((`base_price` >= 0)),
  CONSTRAINT `ticket_chk_2` CHECK ((`final_price` >= 0)),
  CONSTRAINT `ticket_chk_3` CHECK ((`final_price` <= `base_price`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `street_address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(50) NOT NULL,
  `zip_code` varchar(10) NOT NULL,
  `date_of_birth` date NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `visitor`
--

DROP TABLE IF EXISTS `visitor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitor` (
  `user_id` int NOT NULL,
  `last_visit_date` date NOT NULL,
  `total_visits` int NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `visitor_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;