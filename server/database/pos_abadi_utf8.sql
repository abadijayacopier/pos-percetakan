-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: pos_abadi
-- ------------------------------------------------------
-- Server version	5.6.32-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `detail` text,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
INSERT INTO `activity_log` VALUES (1,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 09:11:52'),(2,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 09:35:50'),(3,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 09:39:22'),(4,'u1','Admin Utama','add_transaction','Invoice TRX-202603-2753 (2000)','2026-03-02 09:53:06'),(5,'u1','Admin Utama','add_transaction','Invoice TRX-202603-9322 (2000)','2026-03-02 09:56:56'),(6,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 10:46:12'),(7,'u1','Admin Utama','add_transaction','Invoice TRX-202603-9289 (64000)','2026-03-02 10:46:44'),(8,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 10:52:12'),(9,'u1','Admin Utama','add_transaction','Invoice TRX-202603-1945 (500)','2026-03-02 11:20:17'),(10,'u1','Admin Utama','add_transaction','Invoice TRX-202603-8645 (2500)','2026-03-02 12:00:47'),(11,'u2','Kasir Depan','login','Login sebagai kasir','2026-03-02 12:07:00'),(12,'u2','Kasir Depan','add_transaction','Invoice TRX-202603-8756 (12500)','2026-03-02 12:07:39'),(13,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 12:08:58'),(14,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 13:28:00'),(15,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 13:28:23'),(16,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 18:04:09'),(17,'u1','Admin Utama','login','Login sebagai admin','2026-03-02 18:04:41'),(18,'u1','Admin Utama','login','Login sebagai admin','2026-03-03 01:43:54'),(19,'u1','Admin Utama','login','Login sebagai admin','2026-03-03 04:41:33'),(20,'u2','Kasir Depan','login','Login sebagai kasir','2026-03-03 04:59:13'),(21,'u3','Operator Cetak','login','Login sebagai operator','2026-03-03 04:59:26'),(22,'u4','Teknisi Abadi','login','Login sebagai teknisi','2026-03-03 04:59:34'),(23,'u1','Admin Utama','login','Login sebagai admin','2026-03-03 04:59:51'),(24,'u2','Kasir Depan','login','Login sebagai kasir','2026-03-03 09:54:47'),(25,'u2','Kasir Depan','add_transaction','Invoice TRX-202603-2404 (1000)','2026-03-03 11:06:32'),(26,'u1','Admin Utama','login','Login sebagai admin','2026-03-03 11:07:03'),(27,'u1','Admin Utama','login','Login sebagai admin','2026-03-03 13:51:03'),(28,'u1','Admin Utama','login','Login sebagai admin','2026-03-03 15:40:56');
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_flow`
--

DROP TABLE IF EXISTS `cash_flow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cash_flow` (
  `id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `type` enum('in','out') NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount` int(11) NOT NULL,
  `description` text,
  `reference_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_flow`
--

LOCK TABLES `cash_flow` WRITE;
/*!40000 ALTER TABLE `cash_flow` DISABLE KEYS */;
INSERT INTO `cash_flow` VALUES ('cf1772445186304','2026-03-02','in','Penjualan',2000,'Penjualan fotocopy - TRX-202603-2753','t1772445186296','2026-03-02 09:53:06'),('cf1772445416150','2026-03-02','in','Penjualan',2000,'Penjualan fotocopy - TRX-202603-9322','t1772445416150','2026-03-02 09:56:56'),('cf1772448404895','2026-03-02','in','Penjualan',64000,'Penjualan fotocopy - TRX-202603-9289','t1772448404893','2026-03-02 10:46:44'),('cf1772450417465','2026-03-02','in','Penjualan',500,'Penjualan fotocopy - TRX-202603-1945','t1772450417458','2026-03-02 11:20:17'),('cf1772452847475','2026-03-02','in','Penjualan',2500,'Penjualan fotocopy - TRX-202603-8645','t1772452847473','2026-03-02 12:00:47'),('cf1772453258999','2026-03-02','in','Penjualan',12500,'Penjualan fotocopy - TRX-202603-8756','t1772453258998','2026-03-02 12:07:38'),('cf1772535992569','2026-03-03','in','Penjualan',1000,'Penjualan sale - TRX-202603-2404','t1772535992539','2026-03-03 11:06:32');
/*!40000 ALTER TABLE `cash_flow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum('atk','fotocopy_supply','percetakan_supply','sparepart') NOT NULL,
  `emoji` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('c1','Pulpen & Pensil','atk','≡ƒûè∩╕Å'),('c2','Buku & Kertas','atk','≡ƒôô'),('c3','Map & Amplop','atk','≡ƒôü'),('c4','Stapler & Lem','atk','≡ƒôÄ'),('c5','Kertas Fotocopy','fotocopy_supply','≡ƒôä'),('c6','Toner & Tinta','fotocopy_supply','≡ƒû¿∩╕Å');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `type` enum('walkin','corporate','vip','service') DEFAULT 'walkin',
  `company` varchar(100) DEFAULT NULL,
  `total_trx` int(11) DEFAULT '0',
  `total_spend` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('c1772544446295','ERNA MI','0851546565889','KEDIREN','walkin','SEKOLAH',0,0,'2026-03-03 13:27:26');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fotocopy_prices`
--

DROP TABLE IF EXISTS `fotocopy_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fotocopy_prices` (
  `id` varchar(50) NOT NULL,
  `paper` enum('HVS A4','HVS F4','HVS A3') NOT NULL,
  `color` enum('bw','color') NOT NULL,
  `side` enum('1','2') NOT NULL,
  `price` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fotocopy_prices`
--

LOCK TABLES `fotocopy_prices` WRITE;
/*!40000 ALTER TABLE `fotocopy_prices` DISABLE KEYS */;
INSERT INTO `fotocopy_prices` VALUES ('fc1','HVS A4','bw','1',250,'HVS A4 - B/W - 1 Sisi'),('fc2','HVS A4','bw','2',400,'HVS A4 - B/W - Bolak-balik'),('fc3','HVS F4','bw','1',250,'HVS F4 - B/W - 1 Sisi'),('fc4','HVS F4','bw','2',400,'HVS F4 - B/W - Bolak-balik'),('fc5','HVS A3','bw','1',500,'HVS A3 - B/W - 1 Sisi'),('fc6','HVS A4','color','1',1000,'HVS A4 - Warna - 1 Sisi');
/*!40000 ALTER TABLE `fotocopy_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `print_orders`
--

DROP TABLE IF EXISTS `print_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `print_orders` (
  `id` varchar(50) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `type` varchar(100) NOT NULL,
  `description` text,
  `specs` text,
  `qty` int(11) NOT NULL,
  `unit` varchar(20) DEFAULT 'pcs',
  `total_price` int(11) NOT NULL,
  `dp_amount` int(11) DEFAULT '0',
  `remaining` int(11) DEFAULT '0',
  `shipping_cost` int(11) DEFAULT '0',
  `deadline` date DEFAULT NULL,
  `status` enum('pending','desain','approval','cetak','selesai','diambil','batal') DEFAULT 'pending',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `print_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `print_orders`
--

LOCK TABLES `print_orders` WRITE;
/*!40000 ALTER TABLE `print_orders` DISABLE KEYS */;
INSERT INTO `print_orders` VALUES ('po1772452916677','ORD-2026-0003',NULL,'ISMA','Undangan Pernikahan','LSDFJASLJ','ARTPAPER',100,'lembar',4000,0,6500,2500,'2026-03-31','pending','URGENT','2026-03-02 12:01:56','2026-03-02 12:01:56'),('po1772454610050','ORD-2026-0004',NULL,'GAK ROH','Spanduk / Banner','UKURAN 160X60 CM','MATA AYAM',3,'pcs',25000,0,25000,0,'2026-03-25','pending','URGENT','2026-03-02 12:30:10','2026-03-02 14:47:43'),('po1772465195487','ORD-2026-0005',NULL,'BEBAS','Spanduk / Banner','','Panjang 2m x Lebar 1m',2,'pcs',25000,0,25000,0,'2026-03-18','batal','','2026-03-02 15:26:35','2026-03-03 15:16:02');
/*!40000 ALTER TABLE `print_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category_id` varchar(50) DEFAULT NULL,
  `buy_price` int(11) NOT NULL DEFAULT '0',
  `sell_price` int(11) NOT NULL DEFAULT '0',
  `stock` int(11) NOT NULL DEFAULT '0',
  `min_stock` int(11) NOT NULL DEFAULT '0',
  `unit` varchar(20) DEFAULT 'pcs',
  `emoji` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('p1','ATK-001','Pulpen Pilot BP-1RT','c1',3500,5000,50,10,'pcs','≡ƒûè∩╕Å','2026-03-02 07:54:13'),('p1772508273742','KTS-001','Folio Bergaris Sinar Dunia','c2',250,500,178,10,'lbr','≡ƒôä','2026-03-03 11:06:32'),('p2','ATK-002','Buku Tulis 58 lembar','c2',3000,4500,30,10,'pcs','≡ƒôô','2026-03-02 07:54:13'),('p3','ATK-003','Map Plastik Bercetak F4','c3',2000,3500,60,15,'pcs','≡ƒôü','2026-03-02 07:54:13'),('p4','ATK-004','Kertas HVS A4 70gsm','c5',40000,55000,15,5,'rim','≡ƒôä','2026-03-02 07:54:13'),('p5','ATK-005','Isi Staples No 10','c4',3000,5000,25,10,'box','≡ƒôÄ','2026-03-02 07:54:13');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_orders`
--

DROP TABLE IF EXISTS `service_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_orders` (
  `id` varchar(50) NOT NULL,
  `service_no` varchar(50) NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `machine_info` varchar(100) NOT NULL,
  `serial_no` varchar(50) DEFAULT NULL,
  `complaint` text NOT NULL,
  `condition_physic` text,
  `diagnosis` text,
  `labor_cost` int(11) DEFAULT '0',
  `total_cost` int(11) DEFAULT '0',
  `status` enum('diterima','diagnosa','approval','tunggu_part','pengerjaan','testing','selesai','diambil','batal') DEFAULT 'diterima',
  `technician_id` varchar(50) DEFAULT NULL,
  `warranty_end` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_no` (`service_no`),
  KEY `customer_id` (`customer_id`),
  KEY `technician_id` (`technician_id`),
  CONSTRAINT `service_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `service_orders_ibfk_2` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_orders`
--

LOCK TABLES `service_orders` WRITE;
/*!40000 ALTER TABLE `service_orders` DISABLE KEYS */;
INSERT INTO `service_orders` VALUES ('so1772448913430','SRV-2026-0001',NULL,'FC ANGGUN','','KYOCERA','2040','PAPER JAM',NULL,'Fixing Fil',150000,400000,'batal','u1',NULL,'2026-03-02 10:55:13','2026-03-03 15:10:34');
/*!40000 ALTER TABLE `service_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_spareparts`
--

DROP TABLE IF EXISTS `service_spareparts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_spareparts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_order_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `qty` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `service_order_id` (`service_order_id`),
  CONSTRAINT `service_spareparts_ibfk_1` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_spareparts`
--

LOCK TABLES `service_spareparts` WRITE;
/*!40000 ALTER TABLE `service_spareparts` DISABLE KEYS */;
INSERT INTO `service_spareparts` VALUES (1,'so1772448913430','Fixing Film',1,250000);
/*!40000 ALTER TABLE `service_spareparts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(50) NOT NULL,
  `type` enum('in','out','adjust') NOT NULL,
  `qty` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,'p1772508273742','out',2,'2026-03-03 11:06:32','TRX-202603-2404','Penjualan POS');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact` varchar(50) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_details`
--

DROP TABLE IF EXISTS `transaction_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transaction_details` (
  `id` varchar(50) NOT NULL,
  `transaction_id` varchar(50) NOT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `qty` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `subtotal` int(11) NOT NULL,
  `discount` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `transaction_details_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_details`
--

LOCK TABLES `transaction_details` WRITE;
/*!40000 ALTER TABLE `transaction_details` DISABLE KEYS */;
INSERT INTO `transaction_details` VALUES ('td1772445186298269','t1772445186296',NULL,'HVS A4 - B/W - 1 Sisi',8,250,2000,0),('td177244541615032','t1772445416150',NULL,'HVS A4 - B/W - 1 Sisi',8,250,2000,0),('td1772448404895964','t1772448404893',NULL,'HVS A4 - B/W - 1 Sisi',320,200,64000,16000),('td1772450417459119','t1772450417458',NULL,'HVS A4 - B/W - 1 Sisi',2,250,500,0),('td1772452847475509','t1772452847473',NULL,'HVS A4 - B/W - 1 Sisi',10,250,2500,0),('td1772453258999239','t1772453258998',NULL,'HVS A4 - B/W - 1 Sisi',50,250,12500,0),('td1772535992548941','t1772535992539','p1772508273742','Folio Bergaris Sinar Dunia',2,500,1000,0);
/*!40000 ALTER TABLE `transaction_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactions` (
  `id` varchar(50) NOT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT 'Umum',
  `user_id` varchar(50) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `type` enum('sale','fotocopy') DEFAULT 'sale',
  `subtotal` int(11) NOT NULL,
  `discount` int(11) DEFAULT '0',
  `total` int(11) NOT NULL,
  `paid` int(11) DEFAULT '0',
  `change_amount` int(11) DEFAULT '0',
  `payment_type` enum('tunai','transfer','qris','hutang') NOT NULL,
  `status` enum('paid','unpaid') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `customer_id` (`customer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES ('t1772445186296','TRX-202603-2753','2026-03-02 09:53:06',NULL,'Umum','u1','Admin Utama','fotocopy',2000,0,2000,2000,0,'tunai','paid'),('t1772445416150','TRX-202603-9322','2026-03-02 09:56:56',NULL,'Umum','u1','Admin Utama','fotocopy',2000,0,2000,2000,0,'tunai','paid'),('t1772448404893','TRX-202603-9289','2026-03-02 10:46:44',NULL,'Umum','u1','Admin Utama','fotocopy',64000,16000,64000,64000,0,'tunai','paid'),('t1772450417458','TRX-202603-1945','2026-03-02 11:20:17',NULL,'Umum','u1','Admin Utama','fotocopy',500,0,500,1000,500,'tunai','paid'),('t1772452847473','TRX-202603-8645','2026-03-02 12:00:47',NULL,'Umum','u1','Admin Utama','fotocopy',2500,0,2500,2500,0,'tunai','paid'),('t1772453258998','TRX-202603-8756','2026-03-02 12:07:38',NULL,'Umum','u2','Kasir Depan','fotocopy',12500,0,12500,12500,0,'tunai','paid'),('t1772535992539','TRX-202603-2404','2026-03-03 11:06:32',NULL,'Umum','u2','Kasir Depan','sale',1000,0,1000,1000,0,'tunai','paid');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','kasir','operator','teknisi') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('u1','Admin Utama','admin','$2a$10$n9/cIBjrxpwVV2jgKFvsxugf5z1VCn6pRHtdE6e740zcZMn9BfAJ.','admin',1,'2026-03-02 07:54:13'),('u2','Kasir Depan','kasir','$2a$10$PkYRu22JWREWQOa0zL9r7eWUrHzl2k.4oyqRNIJoAj4ZIAgrTsm02','kasir',1,'2026-03-02 07:54:13'),('u3','Operator Cetak','operator','$2a$10$eOgUAkLo/K.nVc2N7q.PReZy1fP1UmHDzJxde2/hFy3sMKqFqDbCK','operator',1,'2026-03-02 07:54:13'),('u4','Teknisi Abadi','teknisi','$2a$10$wMMwUktwu5xRgvZR/Vg0Y.omvTE9ofjSaVW/sB1OezWyOxTZritya','teknisi',1,'2026-03-02 07:54:13');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-03 22:44:04
