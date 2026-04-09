-- POS ABADI JAYA DATABASE DUMP
-- Generated on 2026-04-09T11:13:42.740Z

CREATE DATABASE IF NOT EXISTS `pos_abadi`;
USE `pos_abadi`;

-- Structure for table `activity_log`
DROP TABLE IF EXISTS `activity_log`;
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
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8;

-- Data for table `activity_log`
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (1, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-09 07:24:26');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (2, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-09 17:35:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (3, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-09 17:48:17');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (4, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-09 21:08:34');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (5, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 00:52:07');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (6, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 12:32:23');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (7, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-9177 ditugaskan ke Andi Desainer', '2026-03-10 12:40:10');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (8, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 12:41:47');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (9, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 12:47:34');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (10, 'des001', 'Andi Desainer', 'Mulai Desain', 'Operator mulai mengerjakan pesanan ORD-9177', '2026-03-10 12:47:46');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (11, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 12:55:20');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (12, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 12:59:40');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (13, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-8330 ditugaskan ke Budi Desainer', '2026-03-10 13:40:09');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (14, 'u3', 'Operator Cetak', 'login', 'Login sebagai operator', '2026-03-10 13:45:52');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (15, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 13:46:09');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (16, 'u4', 'Teknisi Abadi', 'login', 'Login sebagai teknisi', '2026-03-10 13:46:14');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (17, 'u2', 'Kasir Depan', 'login', 'Login sebagai kasir', '2026-03-10 13:46:35');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (18, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 13:46:42');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (19, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 13:57:43');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (20, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 13:57:55');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (21, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 13:57:59');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (22, 'des001', 'Andi Desainer', 'Selesai Desain', 'Operator menyelesaikan desain pesanan ORD-9177', '2026-03-10 13:58:14');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (23, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 13:58:19');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (24, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 13:58:22');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (25, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 13:58:28');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (26, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 13:58:54');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (27, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-6334 ditugaskan ke Andi Desainer', '2026-03-10 13:59:03');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (28, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 13:59:07');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (29, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 13:59:19');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (30, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 14:11:33');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (31, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 14:27:18');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (32, 'des001', 'Andi Desainer', 'Mulai Desain', 'Operator mulai mengerjakan pesanan ORD-6334', '2026-03-10 14:27:31');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (33, 'des001', 'Andi Desainer', 'Selesai Desain', 'Operator menyelesaikan desain pesanan ORD-6334', '2026-03-10 14:27:55');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (34, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 14:28:01');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (35, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 14:39:49');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (36, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-2966 ditugaskan ke Andi Desainer', '2026-03-10 14:43:45');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (37, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-10 14:44:29');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (38, 'des001', 'Andi Desainer', 'Mulai Desain', 'Operator mulai mengerjakan pesanan ORD-2966', '2026-03-10 14:45:01');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (39, 'des001', 'Andi Desainer', 'Selesai Desain', 'Operator menyelesaikan desain pesanan ORD-2966', '2026-03-10 14:45:57');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (40, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-10 14:46:11');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (41, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-11 11:16:32');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (42, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-8287 ditugaskan ke Andi Desainer', '2026-03-11 11:23:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (43, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-11 11:23:58');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (44, 'des001', 'Andi Desainer', 'Mulai Desain', 'Operator mulai mengerjakan pesanan ORD-8287', '2026-03-11 11:24:03');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (45, 'des001', 'Andi Desainer', 'Selesai Desain', 'Operator menyelesaikan desain pesanan ORD-8287', '2026-03-11 11:24:08');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (46, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-11 11:24:12');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (47, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-3511 ditugaskan ke Supri', '2026-03-11 11:41:24');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (48, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-11 11:41:30');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (49, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-11 11:41:56');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (50, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-11 11:43:06');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (51, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-11 11:43:16');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (52, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-11 11:47:36');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (53, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-11 11:52:54');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (54, 'des1773155248207', 'Supri', 'Mulai Desain', 'Operator mulai mengerjakan pesanan ORD-3511', '2026-03-11 11:53:06');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (55, 'des1773155248207', 'Supri', 'Selesai Desain', 'Operator menyelesaikan desain pesanan ORD-3511', '2026-03-11 11:53:23');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (56, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-11 11:53:30');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (57, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-6955 ditugaskan ke Andi Desainer', '2026-03-11 12:09:30');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (58, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-11 12:11:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (59, 'des001', 'Andi Desainer', 'Mulai Desain', 'Operator mulai mengerjakan pesanan ORD-6955', '2026-03-11 12:11:51');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (60, 'des001', 'Andi Desainer', 'Selesai Desain', 'Operator menyelesaikan desain pesanan ORD-6955', '2026-03-11 12:11:54');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (61, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-11 12:12:01');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (62, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-13 16:50:34');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (63, 'u2', 'Kasir Depan', 'login', 'Login sebagai kasir', '2026-03-13 17:09:39');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (64, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-13 18:35:18');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (65, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-2768 ditugaskan ke Andi Desainer', '2026-03-14 01:48:47');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (66, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-14 02:34:24');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (67, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 02:35:22');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (68, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 07:18:43');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (69, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 07:33:35');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (70, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 07:35:54');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (71, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 07:36:26');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (72, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 07:48:12');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (73, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 07:53:21');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (74, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-03-14 07:54:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (75, 'u4', 'Teknisi Abadi', 'login', 'Login sebagai teknisi', '2026-03-14 07:56:14');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (76, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 07:56:50');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (77, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 08:52:07');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (78, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 09:14:00');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (79, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 09:37:04');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (80, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 09:54:22');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (81, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 11:15:34');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (82, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 11:25:39');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (83, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 11:26:42');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (84, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 11:29:57');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (85, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 11:42:08');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (86, 'u2', 'Kasir Depan', 'login', 'Login sebagai kasir', '2026-03-14 11:50:15');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (87, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 12:01:18');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (88, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 15:48:21');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (89, 'u4', 'Teknisi Abadi', 'login', 'Login sebagai teknisi', '2026-03-14 15:55:36');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (90, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 16:16:18');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (91, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 16:24:16');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (92, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-14 17:08:37');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (93, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 02:45:42');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (94, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 02:54:04');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (95, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 03:41:14');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (96, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 08:50:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (97, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 09:16:28');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (98, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 10:57:33');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (99, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 10:57:41');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (100, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 11:24:06');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (101, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 11:58:36');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (102, 'des002', 'Budi Desainer', 'login', 'Login sebagai desainer', '2026-03-15 12:18:53');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (103, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 12:19:04');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (104, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 15:35:17');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (105, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 16:39:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (106, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 18:04:37');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (107, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 18:05:34');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (108, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-15 18:06:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (109, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-4309 ditugaskan ke Supri', '2026-03-15 21:46:50');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (110, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 05:59:12');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (111, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 06:06:14');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (112, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-16 11:06:55');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (113, 'des1773155248207', 'Supri', 'Mulai Desain', 'Operator mulai mengerjakan pesanan ORD-4309', '2026-03-16 11:26:27');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (114, 'des1773155248207', 'Supri', 'Selesai Desain', 'Operator menyelesaikan desain pesanan ORD-4309', '2026-03-16 11:26:53');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (115, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-16 11:58:07');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (116, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-16 12:01:07');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (117, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-16 12:03:03');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (118, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 12:13:27');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (119, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 12:28:05');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (120, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 12:48:30');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (121, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 12:54:13');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (122, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-16 12:54:32');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (123, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-16 12:56:13');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (124, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 16:51:50');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (125, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 17:03:20');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (126, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 17:04:30');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (127, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-16 17:12:31');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (128, 'u2', 'Kasir Depan', 'login', 'Login sebagai kasir', '2026-03-16 17:21:10');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (129, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 17:21:27');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (130, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 17:51:29');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (131, 'des1773155248207', 'Supri', 'login', 'Login sebagai desainer', '2026-03-16 17:53:18');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (132, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-16 17:53:38');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (133, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 00:17:56');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (134, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 10:48:53');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (135, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 12:15:59');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (136, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 12:37:45');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (137, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 17:41:50');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (138, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 17:44:36');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (139, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 17:50:50');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (140, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 17:52:28');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (141, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-17 18:16:42');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (142, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-18 00:26:19');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (143, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-18 17:39:29');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (144, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-19 14:31:31');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (145, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-19 15:00:08');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (146, 'u1', 'Admin Utama', 'Tugaskan Desainer', 'Pesanan ORD-1202 ditugaskan ke Supri', '2026-03-21 05:02:00');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (147, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-21 05:07:11');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (148, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 06:13:14');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (149, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 06:13:44');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (150, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 06:14:08');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (151, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 06:19:33');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (152, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 06:25:36');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (154, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 09:28:47');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (155, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-2545 (500)', '2026-03-22 09:57:45');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (156, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-2987 (500)', '2026-03-22 09:58:30');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (157, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 11:11:13');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (158, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 11:40:57');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (159, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 12:03:28');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (160, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-7418 (1000)', '2026-03-22 12:50:55');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (161, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-2152 (1000)', '2026-03-22 12:51:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (162, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-22 14:13:17');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (163, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-23 10:06:50');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (164, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-23 17:01:38');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (165, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-2871 (50000)', '2026-03-24 00:56:32');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (166, 'u1', 'Admin Utama', 'delete_transaction', 'Hapus & Void TRX t1774313792008', '2026-03-24 01:00:33');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (167, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-9614 (3000)', '2026-03-24 05:06:40');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (168, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-8700 (6250)', '2026-03-24 09:14:33');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (169, 'u1', 'Admin Utama', 'edit_transaction', 'Edit Transaksi t1774343673551 ', '2026-03-24 09:20:56');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (170, 'u1', 'Admin Utama', 'edit_transaction', 'Edit Transaksi t1774343673551 ', '2026-03-24 09:21:01');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (171, 'u1', 'Admin Utama', 'edit_transaction', 'Edit Transaksi t1774343673551 ', '2026-03-24 09:21:53');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (172, 'u1', 'Admin Utama', 'delete_transaction', 'Hapus & Void TRX t1774343673551', '2026-03-24 09:39:38');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (173, 'u1', 'Admin Utama', 'edit_transaction', 'Edit Transaksi t1774328800360 ', '2026-03-24 17:35:18');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (174, 'u1', 'Admin Utama', 'edit_transaction', 'Edit Transaksi t1774328800360 ', '2026-03-24 17:40:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (175, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-2662 (1000)', '2026-03-24 17:44:37');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (176, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-9586 (1000)', '2026-03-24 17:55:22');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (177, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-4246 (6250)', '2026-03-25 01:22:20');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (178, 'u1', 'Admin Utama', 'delete_transaction', 'Hapus & Void TRX t1774401740124', '2026-03-25 01:30:46');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (179, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-6443 (1000)', '2026-03-25 05:23:00');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (180, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-9989 (6250)', '2026-03-25 09:55:02');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (181, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-1505 (7500)', '2026-03-25 11:33:31');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (182, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-31 15:34:12');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (183, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-03-31 15:37:35');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (184, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202603-8009 (750)', '2026-03-31 15:37:48');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (185, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-01 15:27:38');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (186, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-01 15:35:44');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (187, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-01 15:39:11');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (188, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-1522 (750)', '2026-04-01 15:41:29');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (189, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-3417 (1000)', '2026-04-01 15:42:04');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (190, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-02 09:21:58');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (191, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-02 09:31:11');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (192, 'u2', 'Kasir Depan', 'login', 'Login sebagai kasir', '2026-04-02 09:32:16');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (193, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-02 09:36:15');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (194, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-4887 (5500)', '2026-04-02 10:02:23');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (195, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-8791 (15000)', '2026-04-02 10:15:39');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (196, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-02 10:43:40');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (197, 'des001', 'Andi Desainer', 'login', 'Login sebagai desainer', '2026-04-02 10:44:41');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (198, 'des001', 'Andi Desainer', 'Mulai Desain', 'Operator mulai mengerjakan pesanan ORD-2768', '2026-04-02 10:44:57');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (199, 'des001', 'Andi Desainer', 'Selesai Desain', 'Operator menyelesaikan desain pesanan ORD-2768', '2026-04-02 10:45:11');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (200, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-02 10:45:15');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (201, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-4603 (250)', '2026-04-02 12:05:27');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (202, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-5961 (500)', '2026-04-02 12:23:11');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (203, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-2863 (250)', '2026-04-02 12:23:59');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (204, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-4827 (500)', '2026-04-02 12:32:08');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (205, 'u1', 'Admin Utama', 'add_transaction', 'Invoice TRX-202604-7178 (250)', '2026-04-02 12:38:41');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (206, 'u1', 'Admin Utama', 'delete_transaction', 'Hapus & Void TRX t1775133521084', '2026-04-02 12:51:21');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (207, 'u1', 'Admin Utama', 'delete_transaction', 'Hapus & Void TRX t1775133128268', '2026-04-02 12:51:23');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (208, 'u1', 'Admin Utama', 'delete_transaction', 'Hapus & Void TRX t1775132639220', '2026-04-02 12:51:25');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (209, 'u1', 'Admin Utama', 'delete_transaction', 'Hapus & Void TRX t1775132591045', '2026-04-02 12:51:28');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (210, 'u1', 'Admin Utama', 'delete_transaction', 'Hapus & Void TRX t1775131527142', '2026-04-02 12:51:31');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (211, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-02 13:05:31');
INSERT INTO `activity_log` (`id`, `user_id`, `user_name`, `action`, `detail`, `timestamp`) VALUES (212, 'u1', 'Admin Utama', 'login', 'Login sebagai admin', '2026-04-09 11:10:58');

-- Structure for table `cash_flow`
DROP TABLE IF EXISTS `cash_flow`;
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

-- Data for table `cash_flow`
INSERT INTO `cash_flow` (`id`, `date`, `type`, `category`, `amount`, `description`, `reference_id`, `created_at`) VALUES ('cf1774416180886', '2026-03-24 17:00:00', 'in', 'Penjualan', 1000, 'Penjualan service - TRX-202603-6443', 't1774416180876', '2026-03-25 05:23:00');
INSERT INTO `cash_flow` (`id`, `date`, `type`, `category`, `amount`, `description`, `reference_id`, `created_at`) VALUES ('cf1774432502923', '2026-03-24 17:00:00', 'in', 'Penjualan', 6250, 'Penjualan service - TRX-202603-9989', 't1774432502919', '2026-03-25 09:55:02');
INSERT INTO `cash_flow` (`id`, `date`, `type`, `category`, `amount`, `description`, `reference_id`, `created_at`) VALUES ('cf1774438411962', '2026-03-24 17:00:00', 'in', 'Penjualan', 8000, 'Penjualan service - TRX-202603-1505', 't1774438411959', '2026-03-25 11:33:31');
INSERT INTO `cash_flow` (`id`, `date`, `type`, `category`, `amount`, `description`, `reference_id`, `created_at`) VALUES ('cf1774971468700', '2026-03-30 17:00:00', 'in', 'Penjualan', 750, 'Penjualan service - TRX-202603-8009', 't1774971468692', '2026-03-31 15:37:48');
INSERT INTO `cash_flow` (`id`, `date`, `type`, `category`, `amount`, `description`, `reference_id`, `created_at`) VALUES ('cf1775058089943', '2026-03-31 17:00:00', 'in', 'Penjualan', 750, 'Penjualan service - TRX-202604-1522', 't1775058089937', '2026-04-01 15:41:29');
INSERT INTO `cash_flow` (`id`, `date`, `type`, `category`, `amount`, `description`, `reference_id`, `created_at`) VALUES ('cf1775058124148', '2026-03-31 17:00:00', 'in', 'Penjualan', 1000, 'Penjualan service - TRX-202604-3417', 't1775058124133', '2026-04-01 15:42:04');
INSERT INTO `cash_flow` (`id`, `date`, `type`, `category`, `amount`, `description`, `reference_id`, `created_at`) VALUES ('cf1775124143838', '2026-04-01 17:00:00', 'in', 'Penjualan', 5500, 'Penjualan service - TRX-202604-4887', 't1775124143835', '2026-04-02 10:02:23');
INSERT INTO `cash_flow` (`id`, `date`, `type`, `category`, `amount`, `description`, `reference_id`, `created_at`) VALUES ('cf1775124939086', '2026-04-01 17:00:00', 'in', 'Penjualan', 15000, 'Penjualan service - TRX-202604-8791', 't1775124939081', '2026-04-02 10:15:39');

-- Structure for table `categories`
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum('atk','fotocopy_supply','percetakan_supply','sparepart') NOT NULL,
  `emoji` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data for table `categories`
INSERT INTO `categories` (`id`, `name`, `type`, `emoji`) VALUES ('buku-4277', 'Buku', 'atk', '📁');
INSERT INTO `categories` (`id`, `name`, `type`, `emoji`) VALUES ('cat-dummy-1', 'Percetakan Offset', 'percetakan_supply', NULL);
INSERT INTO `categories` (`id`, `name`, `type`, `emoji`) VALUES ('kertas-2867', 'KERTAS', 'atk', '📁');
INSERT INTO `categories` (`id`, `name`, `type`, `emoji`) VALUES ('polpen-4484', 'POLPEN', 'atk', '📁');

-- Structure for table `customers`
DROP TABLE IF EXISTS `customers`;
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

-- Data for table `customers`
INSERT INTO `customers` (`id`, `name`, `phone`, `address`, `type`, `company`, `total_trx`, `total_spend`, `created_at`) VALUES ('c1775132386225', 'BALAI DESA KEDIREN', '085655620979', 'KEDIREN', 'walkin', 'Instansi Desa', 0, 0, '2026-04-02 12:19:46');

-- Structure for table `design_assignments`
DROP TABLE IF EXISTS `design_assignments`;
CREATE TABLE `design_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` varchar(50) NOT NULL COMMENT 'ID pesanan dari dp_tasks (localStorage)',
  `designer_id` varchar(50) NOT NULL COMMENT 'FK ke users (role=desainer)',
  `status` enum('ditugaskan','dikerjakan','selesai','dibatalkan') NOT NULL DEFAULT 'ditugaskan',
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` datetime DEFAULT NULL COMMENT 'Waktu operator klik Mulai Desain',
  `finished_at` datetime DEFAULT NULL COMMENT 'Waktu operator klik Selesai Desain',
  `catatan` text,
  `file_hasil_desain` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_da_designer` (`designer_id`),
  CONSTRAINT `fk_da_designer` FOREIGN KEY (`designer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 COMMENT='Penugasan pesanan cetak ke operator desain';

-- Data for table `design_assignments`
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (1, 'ORD-9177', 'des001', 'selesai', '2026-03-10 12:40:10', '2026-03-10 12:47:46', '2026-03-10 13:58:14', NULL, NULL, '2026-03-10 12:40:10', '2026-03-10 13:58:14');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (2, 'ORD-8330', 'des002', 'ditugaskan', '2026-03-10 13:40:09', NULL, NULL, NULL, NULL, '2026-03-10 13:40:09', '2026-03-10 13:40:09');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (3, 'ORD-6334', 'des001', 'selesai', '2026-03-10 13:59:03', '2026-03-10 14:27:31', '2026-03-10 14:27:55', 'siap cetak', NULL, '2026-03-10 13:59:03', '2026-03-10 14:27:55');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (4, 'ORD-2966', 'des001', 'selesai', '2026-03-10 14:43:45', '2026-03-10 14:45:01', '2026-03-10 14:45:57', 'Siap cetak mata ayam 5', NULL, '2026-03-10 14:43:45', '2026-03-10 14:45:57');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (5, 'ORD-8287', 'des001', 'selesai', '2026-03-11 11:23:48', '2026-03-11 11:24:03', '2026-03-11 11:24:08', NULL, NULL, '2026-03-11 11:23:48', '2026-03-11 11:24:08');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (6, 'ORD-3511', 'des1773155248207', 'selesai', '2026-03-11 11:41:24', '2026-03-11 11:53:06', '2026-03-11 11:53:23', NULL, NULL, '2026-03-11 11:41:24', '2026-03-11 11:53:23');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (7, 'ORD-6955', 'des001', 'selesai', '2026-03-11 12:09:30', '2026-03-11 12:11:51', '2026-03-11 12:11:54', NULL, NULL, '2026-03-11 12:09:30', '2026-03-11 12:11:54');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (8, 'ORD-2768', 'des001', 'selesai', '2026-03-14 01:48:47', '2026-04-02 10:44:57', '2026-04-02 10:45:11', NULL, NULL, '2026-03-14 01:48:47', '2026-04-02 10:45:11');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (9, 'ORD-4309', 'des1773155248207', 'selesai', '2026-03-15 21:46:50', '2026-03-16 11:26:27', '2026-03-16 11:26:53', NULL, NULL, '2026-03-15 21:46:50', '2026-03-16 11:26:53');
INSERT INTO `design_assignments` (`id`, `task_id`, `designer_id`, `status`, `assigned_at`, `started_at`, `finished_at`, `catatan`, `file_hasil_desain`, `created_at`, `updated_at`) VALUES (10, 'ORD-1202', 'des1773155248207', 'ditugaskan', '2026-03-21 05:02:00', NULL, NULL, NULL, NULL, '2026-03-21 05:02:00', '2026-03-21 05:02:00');

-- Structure for table `design_logs`
DROP TABLE IF EXISTS `design_logs`;
CREATE TABLE `design_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_item_id` varchar(50) NOT NULL,
  `technician_id` varchar(50) DEFAULT NULL COMMENT 'User yang menjalankan timer',
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL COMMENT 'NULL = timer masih berjalan',
  `total_durasi_menit` int(11) DEFAULT NULL COMMENT 'Durasi manual (menit)',
  `tarif_per_jam` int(11) NOT NULL DEFAULT '50000' COMMENT 'Tarif desain saat sesi dicatat (Rp/jam)',
  `total_biaya_desain` int(11) DEFAULT NULL COMMENT 'Biaya desain (Rp)',
  `catatan` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_dl_order_item` (`order_item_id`),
  KEY `fk_dl_technician` (`technician_id`),
  CONSTRAINT `fk_dl_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dl_technician` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COMMENT='Log sesi timer jasa desain';

-- Data for table `design_logs`
INSERT INTO `design_logs` (`id`, `order_item_id`, `technician_id`, `start_time`, `end_time`, `total_durasi_menit`, `tarif_per_jam`, `total_biaya_desain`, `catatan`, `created_at`) VALUES (1, 'oi17730411013352rd6', 'u1', '2026-03-09 07:25:15', '2026-03-09 07:25:27', NULL, 50000, NULL, NULL, '2026-03-09 07:25:15');
INSERT INTO `design_logs` (`id`, `order_item_id`, `technician_id`, `start_time`, `end_time`, `total_durasi_menit`, `tarif_per_jam`, `total_biaya_desain`, `catatan`, `created_at`) VALUES (2, 'oi17730411013352rd6', 'u1', '2026-03-09 07:28:10', '2026-03-09 07:28:20', NULL, 50000, NULL, NULL, '2026-03-09 07:28:10');
INSERT INTO `design_logs` (`id`, `order_item_id`, `technician_id`, `start_time`, `end_time`, `total_durasi_menit`, `tarif_per_jam`, `total_biaya_desain`, `catatan`, `created_at`) VALUES (3, 'oi1773041922898ldnh', 'u1', '2026-03-09 07:39:10', '2026-03-09 07:39:45', NULL, 50000, NULL, NULL, '2026-03-09 07:39:10');

-- Structure for table `design_sessions`
DROP TABLE IF EXISTS `design_sessions`;
CREATE TABLE `design_sessions` (
  `id` varchar(50) NOT NULL,
  `technician_id` varchar(50) DEFAULT NULL,
  `order_id` varchar(50) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `current_duration` int(11) NOT NULL DEFAULT '0',
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT '50000.00',
  `status` enum('Running','Paused','Completed') NOT NULL DEFAULT 'Running',
  PRIMARY KEY (`id`),
  KEY `fk_ds_technician` (`technician_id`),
  KEY `fk_ds_order` (`order_id`),
  CONSTRAINT `fk_ds_order` FOREIGN KEY (`order_id`) REFERENCES `offset_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ds_technician` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Timer Desain per order offset';

-- Structure for table `dp_tasks`
DROP TABLE IF EXISTS `dp_tasks`;
CREATE TABLE `dp_tasks` (
  `id` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'menunggu_desain',
  `customerName` varchar(100) DEFAULT NULL,
  `customerId` varchar(50) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `material_id` varchar(50) DEFAULT NULL,
  `material_name` varchar(100) DEFAULT NULL,
  `dimensions_w` decimal(10,2) DEFAULT NULL,
  `dimensions_h` decimal(10,2) DEFAULT NULL,
  `material_price` decimal(15,2) DEFAULT '0.00',
  `design_price` decimal(15,2) DEFAULT '0.00',
  `priority` varchar(50) DEFAULT 'normal',
  `pesan_desainer` text,
  `type` varchar(50) DEFAULT 'digital',
  `file_url` text,
  `qty` int(11) DEFAULT '1',
  `designer_id` varchar(50) DEFAULT NULL,
  `designer_name` varchar(100) DEFAULT NULL,
  `operator_id` varchar(50) DEFAULT NULL,
  `operator_name` varchar(100) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  `dp_amount` decimal(15,2) DEFAULT '0.00',
  `is_paid` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Digital Printing tasks (formerly from localStorage)';

-- Data for table `dp_tasks`
INSERT INTO `dp_tasks` (`id`, `status`, `customerName`, `customerId`, `title`, `material_id`, `material_name`, `dimensions_w`, `dimensions_h`, `material_price`, `design_price`, `priority`, `pesan_desainer`, `type`, `file_url`, `qty`, `designer_id`, `designer_name`, `operator_id`, `operator_name`, `started_at`, `finished_at`, `dp_amount`, `is_paid`, `created_at`, `updated_at`) VALUES ('ORD-2088', 'batal', 'Pelanggan Umum', 'c1774175866060', 'Laminasi Glossy (4x3m)', 'mat010', 'Laminasi Glossy', '4.00', '3.00', '420000.00', '0.00', 'normal', 'Jdjdkkaka', 'digital', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, '0.00', 0, '2026-03-23 17:02:36', '2026-03-24 00:51:19');
INSERT INTO `dp_tasks` (`id`, `status`, `customerName`, `customerId`, `title`, `material_id`, `material_name`, `dimensions_w`, `dimensions_h`, `material_price`, `design_price`, `priority`, `pesan_desainer`, `type`, `file_url`, `qty`, `designer_id`, `designer_name`, `operator_id`, `operator_name`, `started_at`, `finished_at`, `dp_amount`, `is_paid`, `created_at`, `updated_at`) VALUES ('ORD-6920', 'batal', 'Pelanggan Umum', 'c1774175866060', 'Frontlite Standard 280gr (2x1m)', 'mat001', 'Frontlite Standard 280gr', '2.00', '1.00', '50000.00', '0.00', 'normal', NULL, 'digital', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, '0.00', 0, '2026-03-24 00:56:31', '2026-03-24 00:56:38');
INSERT INTO `dp_tasks` (`id`, `status`, `customerName`, `customerId`, `title`, `material_id`, `material_name`, `dimensions_w`, `dimensions_h`, `material_price`, `design_price`, `priority`, `pesan_desainer`, `type`, `file_url`, `qty`, `designer_id`, `designer_name`, `operator_id`, `operator_name`, `started_at`, `finished_at`, `dp_amount`, `is_paid`, `created_at`, `updated_at`) VALUES ('ORD-8740', 'batal', 'CLARA PRINTING', 'c1774175866060', 'Laminasi Glossy (3x1m)', 'mat010', 'Laminasi Glossy', '3.00', '1.00', '105000.00', '0.00', 'normal', NULL, 'digital', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, '0.00', 0, '2026-03-24 00:53:44', '2026-03-24 00:54:12');

-- Structure for table `expenses`
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` varchar(50) NOT NULL,
  `kategori` varchar(80) NOT NULL COMMENT 'Listrik, Gaji, Sewa, Pembelian Bahan, dll.',
  `nominal` int(11) NOT NULL DEFAULT '0',
  `tanggal` date NOT NULL,
  `keterangan` text,
  `bukti_foto` varchar(500) DEFAULT NULL COMMENT 'Path / URL foto struk/bukti',
  `requested_by` varchar(50) DEFAULT NULL COMMENT 'User yang mengajukan pengeluaran',
  `status_approval` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` varchar(50) DEFAULT NULL COMMENT 'Owner / admin yang menyetujui',
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_exp_requester` (`requested_by`),
  KEY `fk_exp_approver` (`approved_by`),
  CONSTRAINT `fk_exp_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exp_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Pengeluaran operasional dengan approval';

-- Structure for table `fotocopy_prices`
DROP TABLE IF EXISTS `fotocopy_prices`;
CREATE TABLE `fotocopy_prices` (
  `id` varchar(50) NOT NULL,
  `paper` enum('HVS A4','HVS F4','HVS A3') NOT NULL,
  `color` enum('bw','color') NOT NULL,
  `side` enum('1','2') NOT NULL,
  `price` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data for table `fotocopy_prices`
INSERT INTO `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`) VALUES ('fc1', 'HVS A4', 'bw', '1', 250, 'HVS A4 - B/W - 1 Sisi');
INSERT INTO `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`) VALUES ('fc2', 'HVS A4', 'bw', '2', 400, 'HVS A4 - B/W - Bolak-balik');
INSERT INTO `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`) VALUES ('fc3', 'HVS F4', 'bw', '1', 250, 'HVS F4 - B/W - 1 Sisi');
INSERT INTO `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`) VALUES ('fc4', 'HVS F4', 'bw', '2', 400, 'HVS F4 - B/W - Bolak-balik');
INSERT INTO `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`) VALUES ('fc5', 'HVS A3', 'bw', '1', 1000, 'HVS A3 - B/W - 1 Sisi');
INSERT INTO `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`) VALUES ('fc6', 'HVS A4', 'color', '1', 1000, 'HVS A4 - Warna - 1 Sisi');

-- Structure for table `handovers`
DROP TABLE IF EXISTS `handovers`;
CREATE TABLE `handovers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `handover_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `handover_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `handovers`
INSERT INTO `handovers` (`id`, `transaction_id`, `invoice_no`, `customer_name`, `receiver_name`, `receiver_phone`, `notes`, `handover_date`, `handover_by`) VALUES (1, 't1774173510749', 'TRX-202603-2987', 'Umum', 'Umum', '', '', '2026-04-01 15:37:31', 'Admin');
INSERT INTO `handovers` (`id`, `transaction_id`, `invoice_no`, `customer_name`, `receiver_name`, `receiver_phone`, `notes`, `handover_date`, `handover_by`) VALUES (2, 't1774183855102', 'TRX-202603-7418', 'Umum', 'Umum', '', '', '2026-04-01 15:37:35', 'Admin');

-- Structure for table `material_movements`
DROP TABLE IF EXISTS `material_movements`;
CREATE TABLE `material_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `material_id` varchar(50) NOT NULL,
  `tipe` enum('masuk','keluar','penyesuaian') NOT NULL,
  `jumlah` decimal(10,2) NOT NULL COMMENT 'Selalu positif; tipe menentukan arah',
  `satuan` varchar(20) NOT NULL,
  `referensi` varchar(100) DEFAULT NULL COMMENT 'order_item_id atau nomor pembelian bahan',
  `catatan` text,
  `user_id` varchar(50) DEFAULT NULL,
  `tanggal` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mm_material` (`material_id`),
  KEY `fk_mm_user` (`user_id`),
  CONSTRAINT `fk_mm_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Mutasi / riwayat stok bahan cetak';

-- Structure for table `materials`
DROP TABLE IF EXISTS `materials`;
CREATE TABLE `materials` (
  `id` varchar(50) NOT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `nama_bahan` varchar(100) NOT NULL,
  `kategori` varchar(50) NOT NULL DEFAULT 'digital',
  `satuan` varchar(50) NOT NULL DEFAULT 'm2',
  `harga_modal` int(11) NOT NULL DEFAULT '0' COMMENT 'Harga pokok / modal per satuan (Rp)',
  `harga_jual` int(11) NOT NULL DEFAULT '0' COMMENT 'Harga jual ke pelanggan per satuan (Rp)',
  `stok_saat_ini` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Stok tersedia dalam satuan bahan',
  `stok_minimum` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Batas minimum sebelum notifikasi',
  `lokasi_rak` varchar(100) DEFAULT NULL,
  `supplier_id` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcode` (`barcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Master bahan cetak';

-- Data for table `materials`
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat001', NULL, 'Frontlite Standard 280gr', 'digital', 'm2', 15000, 25000, '50.00', '5.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat002', NULL, 'Frontlite High-Res 340gr', 'digital', 'm2', 22000, 35000, '30.00', '5.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat003', NULL, 'Albatros', 'digital', 'm2', 45000, 65000, '20.00', '3.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat004', NULL, 'Bannertrans / Backlite', 'digital', 'm2', 50000, 75000, '15.00', '3.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat005', NULL, 'Vinyl Stiker Glossy', 'digital', 'm2', 30000, 50000, '25.00', '5.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat006', NULL, 'Vinyl Stiker Matte', 'digital', 'm2', 32000, 55000, '20.00', '5.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat007', NULL, 'HVS A4 70gr', 'offset', 'rim', 30000, 45000, '10.00', '2.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat008', NULL, 'HVS F4 70gr', 'offset', 'rim', 33000, 50000, '10.00', '2.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat009', NULL, 'Art Paper 120gr', 'offset', 'lembar', 500, 900, '500.00', '50.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat010', NULL, 'Laminasi Glossy', 'digital', 'm2', 20000, 35000, '30.00', '5.00', NULL, NULL, 1, '2026-03-04 15:57:40', '2026-03-04 15:57:40');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat1773453500949', 'SKU-308399', 'Material Test 2', 'Digital', 'pcs', 10000, 15000, '50.00', '10.00', NULL, NULL, 1, '2026-03-14 01:58:20', '2026-03-14 01:58:20');
INSERT INTO `materials` (`id`, `barcode`, `nama_bahan`, `kategori`, `satuan`, `harga_modal`, `harga_jual`, `stok_saat_ini`, `stok_minimum`, `lokasi_rak`, `supplier_id`, `is_active`, `created_at`, `updated_at`) VALUES ('mat1773577514880', 'SKU-447201', 'Art Paper 260', 'offset', 'lembar', 250000, 425000, '100.00', '10.00', NULL, '1', 1, '2026-03-15 12:25:14', '2026-03-15 12:25:14');

-- Structure for table `offset_orders`
DROP TABLE IF EXISTS `offset_orders`;
CREATE TABLE `offset_orders` (
  `id` varchar(50) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT '1',
  `spesifikasi_json` text,
  `total_estimasi_produksi` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_biaya_desain` decimal(12,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status_order` enum('Pending','Printing','Finished') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_oo_product` (`product_id`),
  KEY `fk_oo_customer` (`customer_id`),
  CONSTRAINT `fk_oo_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_oo_product` FOREIGN KEY (`product_id`) REFERENCES `offset_products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Pesanan cetak offset';

-- Structure for table `offset_products`
DROP TABLE IF EXISTS `offset_products`;
CREATE TABLE `offset_products` (
  `id` varchar(50) NOT NULL,
  `nama_produk` varchar(100) NOT NULL,
  `deskripsi_singkat` text,
  `harga_base` decimal(10,2) NOT NULL DEFAULT '0.00',
  `satuan` varchar(20) NOT NULL,
  `is_best_seller` tinyint(1) DEFAULT '0',
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Master Katalog Produk Offset';

-- Data for table `offset_products`
INSERT INTO `offset_products` (`id`, `nama_produk`, `deskripsi_singkat`, `harga_base`, `satuan`, `is_best_seller`, `image_url`) VALUES ('op1', 'Cetak Nota', 'Rangkap/NCR (2-4 Ply) - Ukuran Custom (A4, A5, 1/3 A4)', '25000.00', 'buku', 1, NULL);
INSERT INTO `offset_products` (`id`, `nama_produk`, `deskripsi_singkat`, `harga_base`, `satuan`, `is_best_seller`, `image_url`) VALUES ('op2', 'Cetak Buku', 'Hard/Soft Cover Laminating - Jumlah Buku Min. 50 Eks', '50000.00', 'eks', 0, NULL);
INSERT INTO `offset_products` (`id`, `nama_produk`, `deskripsi_singkat`, `harga_base`, `satuan`, `is_best_seller`, `image_url`) VALUES ('op3', 'Cetak Kalender', 'Kalender Dinding & Meja - Kertas Art Paper / Ivory', '15000.00', 'pcs', 0, NULL);
INSERT INTO `offset_products` (`id`, `nama_produk`, `deskripsi_singkat`, `harga_base`, `satuan`, `is_best_seller`, `image_url`) VALUES ('op4', 'Kartu Nama', 'Standar & Premium (Spot UV) - Min. Order 1 Box (100 lbr)', '35000.00', 'box', 0, NULL);

-- Structure for table `order_items`
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` varchar(50) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `layanan` enum('digital_printing','offset','atk','jilid','fotocopy','jasa_desain','lainnya') NOT NULL DEFAULT 'digital_printing',
  `nama_item` varchar(150) NOT NULL COMMENT 'Deskripsi singkat: Banner Warung Makan, Stiker Logo, dll.',
  `material_id` varchar(50) DEFAULT NULL COMMENT 'FK ke materials (NULL untuk jasa desain / ATK)',
  `ukuran_p` decimal(8,2) DEFAULT NULL COMMENT 'Panjang dalam meter (untuk banner/stiker)',
  `ukuran_l` decimal(8,2) DEFAULT NULL COMMENT 'Lebar dalam meter',
  `luas_total` decimal(10,4) DEFAULT NULL COMMENT 'Dihitung: p × l (m²)',
  `quantity` int(11) NOT NULL DEFAULT '1',
  `harga_satuan` int(11) NOT NULL DEFAULT '0' COMMENT 'Per m² atau per pcs, sesuai satuan material',
  `subtotal` int(11) NOT NULL DEFAULT '0' COMMENT 'Dihitung: luas_total × harga_satuan × quantity, atau qty × harga',
  `file_desain` varchar(500) DEFAULT NULL COMMENT 'Path / URL file desain pelanggan',
  `catatan` text,
  PRIMARY KEY (`id`),
  KEY `fk_oi_order` (`order_id`),
  KEY `fk_oi_material` (`material_id`),
  CONSTRAINT `fk_oi_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Item detail per pesanan';

-- Data for table `order_items`
INSERT INTO `order_items` (`id`, `order_id`, `layanan`, `nama_item`, `material_id`, `ukuran_p`, `ukuran_l`, `luas_total`, `quantity`, `harga_satuan`, `subtotal`, `file_desain`, `catatan`) VALUES ('oi17730411013352rd6', 'ord1773041101325', 'digital_printing', 'Banner', 'mat001', '3.00', '0.80', '2.4000', 1, 25000, 60000, NULL, NULL);
INSERT INTO `order_items` (`id`, `order_id`, `layanan`, `nama_item`, `material_id`, `ukuran_p`, `ukuran_l`, `luas_total`, `quantity`, `harga_satuan`, `subtotal`, `file_desain`, `catatan`) VALUES ('oi1773041922898ldnh', 'ord1773041922897', 'digital_printing', 'Banner Wrung', 'mat004', '2.00', '1.00', '2.0000', 1, 75000, 150000, NULL, NULL);

-- Structure for table `orders`
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` varchar(50) NOT NULL,
  `order_number` varchar(50) NOT NULL COMMENT 'Nomor cantik: ORD-9021, dsb.',
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL DEFAULT 'Umum',
  `user_id` varchar(50) DEFAULT NULL COMMENT 'Kasir / operator yang membuat order',
  `total_harga` int(11) NOT NULL DEFAULT '0',
  `status_pembayaran` enum('belum_bayar','dp','lunas') NOT NULL DEFAULT 'belum_bayar',
  `dp_amount` int(11) NOT NULL DEFAULT '0',
  `remaining` int(11) NOT NULL DEFAULT '0' COMMENT 'Sisa tagihan = total_harga - dp_amount',
  `metode_pembayaran` enum('tunai','transfer','qris','hutang') DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `catatan` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_orders_customer` (`customer_id`),
  KEY `fk_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Induk pesanan percetakan (multi-item)';

-- Data for table `orders`
INSERT INTO `orders` (`id`, `order_number`, `customer_id`, `customer_name`, `user_id`, `total_harga`, `status_pembayaran`, `dp_amount`, `remaining`, `metode_pembayaran`, `deadline`, `catatan`, `created_at`, `updated_at`) VALUES ('ord1773041101325', 'ORD-260001', NULL, 'umum', 'u1', 60000, 'belum_bayar', 0, 60000, 'tunai', '2026-03-08 17:00:00', NULL, '2026-03-09 07:25:01', '2026-03-09 07:25:01');
INSERT INTO `orders` (`id`, `order_number`, `customer_id`, `customer_name`, `user_id`, `total_harga`, `status_pembayaran`, `dp_amount`, `remaining`, `metode_pembayaran`, `deadline`, `catatan`, `created_at`, `updated_at`) VALUES ('ord1773041922897', 'ORD-260002', NULL, 'Alamsyah', 'u1', 150000, 'belum_bayar', 0, 150000, 'tunai', '2026-03-18 17:00:00', NULL, '2026-03-09 07:38:42', '2026-03-09 07:38:42');

-- Structure for table `pricing_logs`
DROP TABLE IF EXISTS `pricing_logs`;
CREATE TABLE `pricing_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `payload_sebelum` text,
  `payload_sesudah` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `pricing_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pricing_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Structure for table `pricing_rules`
DROP TABLE IF EXISTS `pricing_rules`;
CREATE TABLE `pricing_rules` (
  `id` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `min_qty` int(11) NOT NULL DEFAULT '0',
  `max_qty` int(11) NOT NULL DEFAULT '0',
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_pr_product` (`product_id`),
  CONSTRAINT `fk_pr_product` FOREIGN KEY (`product_id`) REFERENCES `offset_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Harga grosir/berjenjang offset';

-- Structure for table `print_orders`
DROP TABLE IF EXISTS `print_orders`;
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

-- Structure for table `product_options`
DROP TABLE IF EXISTS `product_options`;
CREATE TABLE `product_options` (
  `id` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `kategori_opsi` enum('Ukuran','Rangkap','Finishing','Bahan','Lainnya') NOT NULL,
  `label_opsi` varchar(100) NOT NULL,
  `tambahan_biaya` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_po_product` (`product_id`),
  CONSTRAINT `fk_po_product` FOREIGN KEY (`product_id`) REFERENCES `offset_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Variabel spesifikasi produk';

-- Data for table `product_options`
INSERT INTO `product_options` (`id`, `product_id`, `kategori_opsi`, `label_opsi`, `tambahan_biaya`) VALUES ('po1', 'op1', 'Rangkap', '2 Ply', '0.00');
INSERT INTO `product_options` (`id`, `product_id`, `kategori_opsi`, `label_opsi`, `tambahan_biaya`) VALUES ('po2', 'op1', 'Rangkap', '3 Ply', '5000.00');
INSERT INTO `product_options` (`id`, `product_id`, `kategori_opsi`, `label_opsi`, `tambahan_biaya`) VALUES ('po3', 'op1', 'Rangkap', '4 Ply', '10000.00');
INSERT INTO `product_options` (`id`, `product_id`, `kategori_opsi`, `label_opsi`, `tambahan_biaya`) VALUES ('po4', 'op1', 'Ukuran', 'A4 (21 x 29.7 cm)', '15000.00');
INSERT INTO `product_options` (`id`, `product_id`, `kategori_opsi`, `label_opsi`, `tambahan_biaya`) VALUES ('po5', 'op1', 'Ukuran', 'A5 (14.8 x 21 cm)', '0.00');
INSERT INTO `product_options` (`id`, `product_id`, `kategori_opsi`, `label_opsi`, `tambahan_biaya`) VALUES ('po6', 'op1', 'Ukuran', '1/3 A4 (10 x 21 cm)', '-5000.00');

-- Structure for table `production_status`
DROP TABLE IF EXISTS `production_status`;
CREATE TABLE `production_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_item_id` varchar(50) NOT NULL COMMENT 'Satu item → satu baris progres',
  `status` enum('menunggu','desain','approval','cetak','finishing','siap_diambil','selesai','batal') NOT NULL DEFAULT 'menunggu',
  `catatan_teknis` text,
  `link_file_desain` varchar(500) DEFAULT NULL COMMENT 'URL file final dari galeri / cloud',
  `foto_sebelum` varchar(500) DEFAULT NULL,
  `foto_sesudah` varchar(500) DEFAULT NULL,
  `operator_id` varchar(50) DEFAULT NULL COMMENT 'Operator yang update status terakhir',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_item_id` (`order_item_id`),
  KEY `fk_ps_operator` (`operator_id`),
  CONSTRAINT `fk_ps_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ps_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COMMENT='Status produksi per item pesanan';

-- Data for table `production_status`
INSERT INTO `production_status` (`id`, `order_item_id`, `status`, `catatan_teknis`, `link_file_desain`, `foto_sebelum`, `foto_sesudah`, `operator_id`, `updated_at`) VALUES (1, 'oi17730411013352rd6', 'selesai', NULL, NULL, NULL, NULL, 'u1', '2026-03-09 07:31:57');
INSERT INTO `production_status` (`id`, `order_item_id`, `status`, `catatan_teknis`, `link_file_desain`, `foto_sebelum`, `foto_sesudah`, `operator_id`, `updated_at`) VALUES (2, 'oi1773041922898ldnh', 'selesai', NULL, NULL, NULL, NULL, 'u1', '2026-03-09 07:40:14');

-- Structure for table `products`
DROP TABLE IF EXISTS `products`;
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
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data for table `products`
INSERT INTO `products` (`id`, `code`, `name`, `category_id`, `buy_price`, `sell_price`, `stock`, `min_stock`, `unit`, `emoji`, `updated_at`, `image`) VALUES ('p1774274054490', 'PRD-MN38YLWI', 'Kertas HVS F4 75gr', 'kertas-2867', 45000, 55000, 5, 1, 'rim', '📦', '2026-03-23 13:54:14', NULL);
INSERT INTO `products` (`id`, `code`, `name`, `category_id`, `buy_price`, `sell_price`, `stock`, `min_stock`, `unit`, `emoji`, `updated_at`, `image`) VALUES ('p1774438374225', 'TZ501', 'POLPEN GEL INK PEN', 'polpen-4484', 2500, 5000, 12, 2, 'pcs', '📦', '2026-03-25 11:32:54', NULL);
INSERT INTO `products` (`id`, `code`, `name`, `category_id`, `buy_price`, `sell_price`, `stock`, `min_stock`, `unit`, `emoji`, `updated_at`, `image`) VALUES ('p1775132313853', 'PRD-MNHFY3FS', 'Kertas Cover', 'kertas-2867', 350, 750, 100, 10, 'lembar', '📦', '2026-04-02 12:18:33', NULL);
INSERT INTO `products` (`id`, `code`, `name`, `category_id`, `buy_price`, `sell_price`, `stock`, `min_stock`, `unit`, `emoji`, `updated_at`, `image`) VALUES ('prod-dummy-1', 'SIDU32', 'Buku Tulis SIDU 32', 'buku-4277', 2500, 3500, 12, 2, 'Buku', NULL, '2026-03-22 14:21:14', NULL);
INSERT INTO `products` (`id`, `code`, `name`, `category_id`, `buy_price`, `sell_price`, `stock`, `min_stock`, `unit`, `emoji`, `updated_at`, `image`) VALUES ('prod-dummy-2', 'BPN-Tizzo', 'Polpen Tizzo 1 mm', 'cat-dummy-1', 3499, 7000, 12, 2, 'Box', NULL, '2026-03-22 14:22:12', NULL);

-- Structure for table `purchase_items`
DROP TABLE IF EXISTS `purchase_items`;
CREATE TABLE `purchase_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_id` varchar(50) NOT NULL,
  `item_type` enum('product','material') NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `qty` decimal(10,2) NOT NULL,
  `unit_cost` int(11) NOT NULL DEFAULT '0',
  `subtotal` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_purchase_items_parent` (`purchase_id`),
  CONSTRAINT `fk_purchase_items_parent` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='Detail item dari transaksi pembelian';

-- Data for table `purchase_items`
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_type`, `item_id`, `item_name`, `qty`, `unit_cost`, `subtotal`) VALUES (1, 'PURC-1774179657396', 'product', 'prod-dummy-1', 'Buku Nota A5 NCR 2 Play', '1.00', 15001, 15001);

-- Structure for table `purchases`
DROP TABLE IF EXISTS `purchases`;
CREATE TABLE `purchases` (
  `id` varchar(50) NOT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `supplier_id` varchar(50) DEFAULT NULL,
  `supplier_name` varchar(100) NOT NULL DEFAULT 'Umum',
  `date` datetime NOT NULL,
  `total_amount` int(11) NOT NULL DEFAULT '0',
  `payment_status` enum('lunas','hutang') NOT NULL DEFAULT 'lunas',
  `notes` text,
  `user_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `fk_purchases_user` (`user_id`),
  CONSTRAINT `fk_purchases_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Daftar transaksi barang masuk / pembelian';

-- Data for table `purchases`
INSERT INTO `purchases` (`id`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `total_amount`, `payment_status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES ('PURC-1774179657396', 'INV-657396', NULL, 'Umum', '2026-03-21 17:00:00', 15001, 'lunas', 'Testing', 'u1', '2026-03-22 11:40:57', '2026-03-22 11:40:57');

-- Structure for table `service_orders`
DROP TABLE IF EXISTS `service_orders`;
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

-- Structure for table `service_spareparts`
DROP TABLE IF EXISTS `service_spareparts`;
CREATE TABLE `service_spareparts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_order_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `qty` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `service_order_id` (`service_order_id`),
  KEY `fk_sparepart_product` (`product_id`),
  CONSTRAINT `fk_sparepart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `service_spareparts_ibfk_1` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Structure for table `settings`
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;

-- Data for table `settings`
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (1, 'tarif_desain_per_jam', '50000');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (2, 'ppn_persen', '0');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (3, 'nama_toko', 'Abadi Jaya Copier');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (4, 'alamat_toko', '');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (5, 'no_whatsapp_toko', '');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (6, 'store_name', 'FOTOCOPY ABADI JAYA');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (7, 'store_address', 'Dsn. Selungguh Rt 06 Desa Kediren Kec. Lembeyan, Kab. Magetan');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (8, 'store_phone', '085655620979');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (9, 'store_maps_url', 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (10, 'store_logo', 'data:image/webp;base64,UklGRqoLAABXRUJQVlA4WAoAAAAgAAAAjwEAjwEASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggvAkAAPBSAJ0BKpABkAE+bTaVSKQ/oiEm0og78A2JaW7hc9USYHH6LqvNfYT/e8h6Ed+N/ePQL+698fAC9dbtmAD6y8RulE0AP5f/d/QSz/vVnsJ9IIB6RxwFTX+ix1j8VBTz0/LGlTz0Oo5sEsJ/CfEYcb5V0/LGlTz0/LGlTxXkMalbNKCnnp+WNKnpAGcplqeen5Y0qeen5Y0swqHvGlTxM8p941UoRFgf5kS3CtX3y00ClBTz08Am0aEpqL4Hx5jKUFPPQboNPVytoZbRrChtf2iapVR0PeNKnnwYWdoS+6yuNIKeen5Y0foHMZPaoS4RmpdWeo/GlTz0/LGN0QlqB2Z3SAny0RmgsaVPPT8sJ7GJYeUdl+QqJjNKCd2Iksth3LjFVDBRZO6BVBmFQ7rbCWP4Qgjvphn6CWpxzaQlbKAPE/bQoo3e3ZWci08hHQVR0O619W9965YTu/2JamFPb6VJxq4vtDxW0p1MzZqv/txIQry3XC6jPfWhSp6CopgTkobhS/ZZhUIhslyp0ST2LVv0vojAmKJ58MnhLXuSThcrEq0orAd9DQwTvnYo25FVaW71hIqqE6ceuIILA48jR/N43+qQjHKx3ar2hR/gvzSSylsKiYytgjHHtBuss9MpQItEpFINqP2uIXTpYDNG334op84e3HofL4hfhNGnK39KH62R9fG5Ct5mqSuNCiMhDUZ7tC6KpyeUAsYnijLdW+b69ECHxGuwUJkuPucVGZBNPd0wCohb5ZUO5YNkjSNrhOdudmXwsD3mUrp4wZkJOQi0k0oNyTaCp+d5vqMUKQccdfLk/+Yw4GhbK1XUKTvR20TCaBM7PSpoXTQEaUFPPT8saXIxUO5woyzfwtWObKB7xpU89PyxpUzuobCXe5K1gAD+/eOIP1+CFF//ocZJm1A/C7KSDDq0EzR3E183xqLqogoYzlS4AiI/i+veMQ4XfhkvSGh1YfzyxDO059EqXhCfgFAEV1uFt1sdHy/GQTpFy+Z4LbpwbOlWiVnmV/Wfj1AzPBDCpdIVtcXLUpk/1iKUNJnpoHuQXwKfZQKzOIVkqquPgBjCV8v8QAHRr3FIetOa9LSJWBcW5EAHizAAABVw7mlmwrPIretIqlJqmabo7uKsh20k/OOUpVmrIPeegAZ12pI3MfSRpAvu0gAOd4b6gDR9RyaYmdUYSwCWZIsqSU0gYpmlhGgFrNjBSzoNsUDNtTG7M9qqsRsrxlRVVaWUG+sHfz1GMb42NHQwAAABqds7b/jmcieDT42xUgDu1ySmxhSGW/xUgDs+eP+VhNB4JA4KslFQcCSVS9mrkgM36f9X3QrR/WeyRuRCtjs/tFhdwAAAaBuFJIrHeP+pn/ehoq0ak7DpGrRu8oS/08wQdXOkAwX1F9hen/o81zDLTAriE6mK0aroccoVbzwmiuD9pfvSjJ1YHKm44HYydOY+gE+zyIGFsqFmaXQlF8kOf4M2wPcy/DyWlR6qxOEvofduPS1s/SWvaHf5wb0oQHqxJNa5Zq68Jkt0vwQb8rAuyaB/uSAxyOWmuf6nN9Hmk303JX/8WZgsGlMleYwO1wv6qMaX6sTu64HUDJtAIch2VL3csvX0xdHL0SZHpqP7/gfDvKJOeq0H5Ias6HVi02M855awgleqXXFd+Pu0ILZuAg+00EX975QCpSMoo0/+KvbKpiRpYRCbB6s5h/c5roal0LKf/tG0nh7c1PF1SIlrZSLCf5DLCLdSOqQYbkWM4tQtKllHm97p1/VCQ5BIo719zBTdeiEFOhM98wpArd0IQ30ABrEyq22+jyURa6di2OqTFM3FRbBNZPp8Sx2jDcaDPkTkdM9ue1mtMc8GTdZyXrmKDPInsYuIZnSlvyugX7t9/GrPdtmN3+7zLexg6/x6y4IrwonophxJ0JV8qFayoAakl9T2b2YYUJYOwuhp2HN+F6568xmNgowVjfcZjMtEbAQnQ7+gJ+Xi0cQaiawOK1bFoND8zbSsZ3EhUJkxCWgdftPfyKm8QuXJ+XVK2ItteUal4rTKw41ud92pvseh/I3a1q0pF4qX22+kyIdC6J7EOa4+KEmafI2X8rLWScQWj/NnGx6hHhMdbWNtah9xFoulo3fqiTm0CsdAhj5Wk8eXrytnw9wKYeKn+qgRFULdfCXIzzPzQBgGF46uV+hIGVHzZXd9MzPpuBT8XYnviHU6j93a3IpWhafJSrGVuj0/g+AukC3P6um+YCl3cdBzZuypc4iMjStHU2Lmf28yclQqQf8BexEH8G5FYQmx5Yr3srLS3k/0OjHVZcM+pj8zHX3jDo8JBdsOC0c/G3SKiI+IJX5T1LE0QiM/m4zeXI6udlpTyO6Ff3asO7dey2ykCtDLWpZ51l63qHHrBZ8gFqAzIzTnn2rI2tnbkez1eT0BQn0t/aU4OzbfGnt+SQtzdQcTZZ/f0CPXgHsU3FWY18v6dQuZyGB1ynik0Djo6qPI2D1teDxcTZi2tt7gGN1hALanmqOmvYAiGqT0v4womVt4zgHbpEGy27gocH754G5h69DLkMaW2km2UiNtho4cPKhdFwjb4UPS9gIeHvN/xSe9jFtwS1Mib10/f6jLEnXyojXsPmhmpgY12JwdX/llEMMvNfH7NwyCiQMEDonaQlMgDVbKQ+tcnnUOvrURilH8y74zRV035Gg6wn660qc5Lcot+E2PGgMET1E+i0OP2jogq5RiaSlduZEi/1/VORji32ds9I68YIDWoPH07KtOjdQko6wlxK54f7WKklzYBUYgZyzE8WJUP4fuvKl1+EUwtFDqVuASsl2xccUR0Eqnvu1CY9mpsSPIvM5NMOl8BaH4Mguwq7Drk5YdjogQRtE4BeZkn5AT19G1e0FcErkqhl3qGJsMlS/ZPekXFKG93h2vvWH5r1dvZ+uvjJzf2wc59M/KHYwASRNlYxChnJLt0X7AE7vBFKNIzgXpnIlWb8Bjo2hvRyOGno9iryOoa+vkd2d7Vr9j1W22MIYc1wQ3XrDk3thY4SCJtFtuO4BRyWeRIz76GOZdBqu4sUZEh7G37HmJ72W8vH3cvAb3bOt1hFCeCun/8jYViaCyv81iXmFAx8QsDti1qx/MJyhjp5b9RHxow7MkhrbhLCxgt3roaCM/I/qdXm/pH3QiDSSokG8FkvuegAUJn7b7NmgabpLlm+I3BY1ia7YuLhJzN/FSCdCt9CW0Bf64ovpuSx/RLAbhj0aveUdGy1sy8ldmR42VZIiVDRAgzUvhtje8B+tA4ElpiwXN8PoVGke+FdtRUmXTgpx2lTeWvgHL7dprYUwWm6ZndGrA4n1Da8AA');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (11, 'landing_logo', '');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (12, 'landing_favicon', '');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (13, 'receipt_footer', '');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (14, 'printer_size', 'lx310');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (15, 'printer_name', 'EPSON LX-310');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (16, 'paper_size', 'A4');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (17, 'auto_print', 'true');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (18, 'landing_gallery', '[]');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (19, 'fc_discounts', '[{"id":"1","minQty":100,"discountPerSheet":50},{"id":"2","minQty":500,"discountPerSheet":75}]');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (20, 'midtrans_key', '');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (21, 'midtrans_is_production', 'false');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (22, 'dana_number', '085655620979');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (23, 'dana_name', 'SUPRIYANTO');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (24, 'bank_name', 'BANK BCA');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (25, 'bank_account', '');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (26, 'bank_account_name', 'SUPRIYANTO');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (27, 'print_prices', '[{"id":"1774179838786","paper":"HVS A4 EPSON","color":"bw","price":"500"},{"id":"1774179843217","paper":"HVS A4 EPSON","color":"color","price":"1000"},{"id":"1774179893993","paper":"PRIN KERTAS COVER EPSON","color":"bw","price":"1500"},{"id":"1774179915393","paper":"PRINT COPY A4 F4 CANON","color":"bw","price":"250"},{"id":"1774328770287","paper":"CETAK FOTO 3R","color":"color","price":"3000"}]');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (28, 'binding_prices', '[{"id":"1774179864153","name":"JILID BIASA PLASTIK","price":"3500"},{"id":"1774179879153","name":"JILID BIASA COVER","price":"3500"},{"id":"1775124089100","name":"Laminating A4 & F4","price":"4000"}]');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (29, 'kategori_bahan', '["digital","offset","atk","finishing"]');
INSERT INTO `settings` (`id`, `key`, `value`) VALUES (30, 'satuan_unit', '["lembar","roll","m2","pcs","box","rim","kg","liter","set"]');

-- Structure for table `spk`
DROP TABLE IF EXISTS `spk`;
CREATE TABLE `spk` (
  `id` varchar(50) NOT NULL,
  `spk_number` varchar(50) NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_phone` varchar(30) DEFAULT NULL,
  `customer_company` varchar(150) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `product_qty` int(11) NOT NULL DEFAULT '1',
  `product_unit` varchar(30) NOT NULL DEFAULT 'pcs',
  `kategori` varchar(50) DEFAULT 'Cetak Offset',
  `specs_material` text,
  `specs_finishing` text,
  `specs_notes` text,
  `biaya_cetak` decimal(12,2) NOT NULL DEFAULT '0.00',
  `biaya_material` decimal(12,2) NOT NULL DEFAULT '0.00',
  `biaya_finishing` decimal(12,2) NOT NULL DEFAULT '0.00',
  `biaya_desain` decimal(12,2) NOT NULL DEFAULT '0.00',
  `biaya_lainnya` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_biaya` decimal(12,2) NOT NULL DEFAULT '0.00',
  `dp_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sisa_tagihan` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('Menunggu Antrian','Dalam Proses Cetak','Finishing','Quality Control','Selesai','Siap Diambil','Diambil','Batal') DEFAULT 'Menunggu Antrian',
  `priority` enum('Rendah','Normal','Tinggi','Urgent') NOT NULL DEFAULT 'Normal',
  `assigned_to` varchar(50) DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `offset_order_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `spk_number` (`spk_number`),
  KEY `fk_spk_customer` (`customer_id`),
  KEY `fk_spk_assigned` (`assigned_to`),
  KEY `fk_spk_created` (`created_by`),
  CONSTRAINT `fk_spk_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_spk_created` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_spk_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Master Surat Perintah Kerja';

-- Data for table `spk`
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-001', 'SPK-2024-00001', NULL, 'Budi Santoso', '0812-3456-7890', 'PT. Maju Bersama', 'Brosur A4 Full Color', 500, 'lembar', 'Cetak Offset', 'Art Paper 150gr', 'Laminasi Glossy', 'Warna harus cerah, pastikan gambar tidak pecah', '750000.00', '200000.00', '150000.00', '100000.00', '0.00', '1200000.00', '500000.00', '700000.00', 'Batal', 'Tinggi', NULL, '2024-10-25 08:00:00', NULL, NULL, '2026-03-04 21:16:18', '2026-03-24 02:38:11', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-002', 'SPK-2024-00002', NULL, 'Ahmad Subarjo', '0857-1122-3344', 'PT. Kreatif Digital Indonesia', 'Buku Nota A5 NCR 3 Ply', 50, 'buku', 'Cetak Offset', 'NCR Top Putih, Middle Pink, Bottom Kuning', 'Jilid Lem Panas, Nomorator 001-500, Porporasi', 'Nomorator harus berurutan tanpa lompat', '500000.00', '150000.00', '200000.00', '50000.00', '0.00', '900000.00', '300000.00', '600000.00', 'Batal', 'Normal', NULL, '2024-10-28 10:00:00', NULL, NULL, '2026-03-04 21:16:18', '2026-03-24 02:38:09', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-003', 'SPK-2024-00003', NULL, 'Siti Rahmawati', '0878-9988-7766', NULL, 'Kartu Nama Premium Spot UV', 5, 'box', 'Cetak Offset', 'Art Carton 310gr', 'Spot UV, Laminasi Doff', 'Desain dari pelanggan, file sudah ready', '175000.00', '50000.00', '75000.00', '0.00', '0.00', '300000.00', '300000.00', '0.00', 'Selesai', 'Normal', NULL, '2024-10-22 05:00:00', '2024-10-21 09:30:00', NULL, '2026-03-04 21:16:18', '2026-03-04 21:16:18', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1772663358560', 'SPK-2026-00001', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Nota NCR', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '166500.00', '0.00', '0.00', '0.00', '0.00', '166500.00', '0.00', '166500.00', 'Batal', 'Normal', NULL, NULL, NULL, NULL, '2026-03-04 22:29:18', '2026-03-24 05:19:01', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1772663365357', 'SPK-2026-00002', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Nota NCR', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '166500.00', '0.00', '0.00', '0.00', '0.00', '166500.00', '0.00', '166500.00', 'Batal', 'Normal', NULL, NULL, NULL, NULL, '2026-03-04 22:29:25', '2026-03-24 05:18:59', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1772671781533', 'SPK-2026-00003', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Nota NCR', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '166500.00', '0.00', '0.00', '0.00', '0.00', '166500.00', '0.00', '166500.00', 'Batal', 'Normal', NULL, NULL, NULL, NULL, '2026-03-05 00:49:41', '2026-03-24 02:37:56', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1772702283189', 'SPK-2026-00004', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Buku / Katalog', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '22200.00', '0.00', '0.00', '0.00', '0.00', '22200.00', '0.00', '22200.00', 'Batal', 'Normal', NULL, NULL, NULL, NULL, '2026-03-05 09:18:03', '2026-03-24 02:38:02', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1773042102613', 'SPK-2026-00005', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Buku / Katalog', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '22200.00', '0.00', '0.00', '0.00', '0.00', '22200.00', '0.00', '22200.00', 'Batal', 'Normal', NULL, NULL, NULL, 'u1', '2026-03-09 07:41:42', '2026-03-24 02:38:05', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1773098134509', 'SPK-2026-00007', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Nota NCR', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '166500.00', '0.00', '0.00', '0.00', '0.00', '166500.00', '0.00', '166500.00', 'Batal', 'Normal', NULL, NULL, NULL, 'u1', '2026-03-09 23:15:34', '2026-03-24 02:37:28', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1773103251989', 'SPK-2026-00008', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Buku / Katalog', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '22200.00', '0.00', '0.00', '0.00', '0.00', '22200.00', '0.00', '22200.00', 'Batal', 'Normal', NULL, NULL, NULL, 'u1', '2026-03-10 00:40:51', '2026-03-24 02:37:26', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1773103417393', 'SPK-2026-00009', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Nota NCR', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '166500.00', '0.00', '0.00', '0.00', '0.00', '166500.00', '0.00', '166500.00', 'Batal', 'Normal', NULL, NULL, NULL, 'u1', '2026-03-10 00:43:37', '2026-03-24 02:37:24', NULL);
INSERT INTO `spk` (`id`, `spk_number`, `customer_id`, `customer_name`, `customer_phone`, `customer_company`, `product_name`, `product_qty`, `product_unit`, `kategori`, `specs_material`, `specs_finishing`, `specs_notes`, `biaya_cetak`, `biaya_material`, `biaya_finishing`, `biaya_desain`, `biaya_lainnya`, `total_biaya`, `dp_amount`, `sisa_tagihan`, `status`, `priority`, `assigned_to`, `deadline`, `completed_at`, `created_by`, `created_at`, `updated_at`, `offset_order_id`) VALUES ('spk-1773114059156', 'SPK-2026-00010', NULL, 'Pelanggan Walk-in', NULL, NULL, 'Offset - Buku / Katalog', 1, 'pcs', 'Cetak Offset', 'HVS 80gr', NULL, 'Ukuran: A4', '22200.00', '0.00', '0.00', '0.00', '0.00', '22200.00', '0.00', '22200.00', 'Batal', 'Normal', NULL, NULL, NULL, 'u1', '2026-03-10 03:40:59', '2026-03-24 02:37:20', NULL);

-- Structure for table `spk_handovers`
DROP TABLE IF EXISTS `spk_handovers`;
CREATE TABLE `spk_handovers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `spk_id` varchar(50) NOT NULL,
  `received_by_name` varchar(150) NOT NULL,
  `received_by_phone` varchar(30) DEFAULT NULL,
  `signature_data` longtext,
  `photo_evidence` text,
  `notes` text,
  `handed_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_spkho_spk` (`spk_id`),
  KEY `fk_spkho_user` (`handed_by`),
  CONSTRAINT `fk_spkho_spk` FOREIGN KEY (`spk_id`) REFERENCES `spk` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spkho_user` FOREIGN KEY (`handed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Bukti serah terima barang';

-- Structure for table `spk_logs`
DROP TABLE IF EXISTS `spk_logs`;
CREATE TABLE `spk_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `spk_id` varchar(50) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text,
  `old_value` varchar(100) DEFAULT NULL,
  `new_value` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_spklog_spk` (`spk_id`),
  KEY `fk_spklog_user` (`user_id`),
  CONSTRAINT `fk_spklog_spk` FOREIGN KEY (`spk_id`) REFERENCES `spk` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spklog_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8 COMMENT='Log aktivitas produksi SPK';

-- Data for table `spk_logs`
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (1, 'spk-1772663358560', NULL, 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-04 22:29:18');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (2, 'spk-1772663365357', NULL, 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-04 22:29:25');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (3, 'spk-1772671781533', NULL, 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-05 00:49:41');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (4, 'spk-1772702283189', NULL, 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-05 09:18:03');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (5, 'spk-1773042102613', 'u1', 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-09 07:41:42');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (10, 'spk-1773098134509', 'u1', 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-09 23:15:34');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (11, 'spk-1773103251989', 'u1', 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-10 00:40:51');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (12, 'spk-1773103417393', 'u1', 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-10 00:43:37');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (13, 'spk-1773114059156', 'u1', 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-10 03:40:59');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (14, 'spk-1773114059156', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Dalam Proses Cetak', 'Menunggu Antrian', 'Dalam Proses Cetak', '2026-03-10 03:41:27');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (15, 'spk-1773114059156', 'u1', 'STATUS_CHANGE', 'Status berubah: Dalam Proses Cetak → Finishing', 'Dalam Proses Cetak', 'Finishing', '2026-03-10 03:41:28');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (16, 'spk-1773114059156', 'u1', 'STATUS_CHANGE', 'Status berubah: Finishing → Quality Control', 'Finishing', 'Quality Control', '2026-03-10 03:41:30');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (17, 'spk-1773114059156', 'u1', 'STATUS_CHANGE', 'Status berubah: Quality Control → Menunggu Antrian', 'Quality Control', 'Menunggu Antrian', '2026-03-10 03:41:31');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (19, 'spk-001', 'u1', 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-13 15:35:38');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (20, 'spk-001', 'u1', 'STATUS_CHANGE', 'Status berubah ke Dalam Proses Cetak', 'Menunggu Antrian', 'Dalam Proses Cetak', '2026-03-13 15:35:38');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (21, 'spk-001', 'u1', 'PAYMENT', 'Uang muka (DP) diterima: Rp 500.000', NULL, '500000', '2026-03-13 15:35:38');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (22, 'spk-002', 'u1', 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-13 15:35:38');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (23, 'spk-003', 'u1', 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian', '2026-03-13 15:35:38');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (24, 'spk-003', 'u1', 'STATUS_CHANGE', 'Status berubah ke Selesai', 'Quality Control', 'Selesai', '2026-03-13 15:35:38');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (26, 'spk-1773042102613', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Dalam Proses Cetak', 'Menunggu Antrian', 'Dalam Proses Cetak', '2026-03-14 02:24:41');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (28, 'spk-1772671781533', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Dalam Proses Cetak', 'Menunggu Antrian', 'Dalam Proses Cetak', '2026-03-15 12:21:39');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (36, 'spk-1773103417393', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Finishing', 'Menunggu Antrian', 'Finishing', '2026-03-15 23:00:41');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (37, 'spk-1773103417393', 'u1', 'STATUS_CHANGE', 'Status berubah: Finishing → Menunggu Antrian', 'Finishing', 'Menunggu Antrian', '2026-03-24 02:08:32');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (40, 'spk-1773114059156', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Batal', 'Menunggu Antrian', 'Batal', '2026-03-24 02:37:20');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (41, 'spk-1773103417393', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Batal', 'Menunggu Antrian', 'Batal', '2026-03-24 02:37:24');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (42, 'spk-1773103251989', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Batal', 'Menunggu Antrian', 'Batal', '2026-03-24 02:37:26');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (43, 'spk-1773098134509', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Batal', 'Menunggu Antrian', 'Batal', '2026-03-24 02:37:28');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (44, 'spk-1772671781533', 'u1', 'STATUS_CHANGE', 'Status berubah: Dalam Proses Cetak → Batal', 'Dalam Proses Cetak', 'Batal', '2026-03-24 02:37:56');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (45, 'spk-1772702283189', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Batal', 'Menunggu Antrian', 'Batal', '2026-03-24 02:38:02');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (46, 'spk-1773042102613', 'u1', 'STATUS_CHANGE', 'Status berubah: Dalam Proses Cetak → Batal', 'Dalam Proses Cetak', 'Batal', '2026-03-24 02:38:05');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (47, 'spk-002', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Batal', 'Menunggu Antrian', 'Batal', '2026-03-24 02:38:09');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (48, 'spk-001', 'u1', 'STATUS_CHANGE', 'Status berubah: Dalam Proses Cetak → Batal', 'Dalam Proses Cetak', 'Batal', '2026-03-24 02:38:11');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (49, 'spk-1772663365357', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Batal', 'Menunggu Antrian', 'Batal', '2026-03-24 05:18:59');
INSERT INTO `spk_logs` (`id`, `spk_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES (50, 'spk-1772663358560', 'u1', 'STATUS_CHANGE', 'Status berubah: Menunggu Antrian → Batal', 'Menunggu Antrian', 'Batal', '2026-03-24 05:19:01');

-- Structure for table `spk_payments`
DROP TABLE IF EXISTS `spk_payments`;
CREATE TABLE `spk_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `spk_id` varchar(50) NOT NULL,
  `payment_type` enum('DP','Pelunasan') NOT NULL DEFAULT 'Pelunasan',
  `method` enum('Tunai','QRIS','Transfer') NOT NULL DEFAULT 'Tunai',
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `bank_ref` varchar(100) DEFAULT NULL,
  `status` enum('Pending','Berhasil','Gagal') NOT NULL DEFAULT 'Berhasil',
  `paid_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_spkpay_spk` (`spk_id`),
  KEY `fk_spkpay_user` (`paid_by`),
  CONSTRAINT `fk_spkpay_spk` FOREIGN KEY (`spk_id`) REFERENCES `spk` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spkpay_user` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COMMENT='Riwayat pembayaran SPK';

-- Data for table `spk_payments`
INSERT INTO `spk_payments` (`id`, `spk_id`, `payment_type`, `method`, `amount`, `bank_ref`, `status`, `paid_by`, `created_at`) VALUES (1, 'spk-001', 'DP', 'Tunai', '500000.00', NULL, 'Berhasil', 'u1', '2026-03-13 15:35:38');
INSERT INTO `spk_payments` (`id`, `spk_id`, `payment_type`, `method`, `amount`, `bank_ref`, `status`, `paid_by`, `created_at`) VALUES (2, 'spk-002', 'DP', 'Transfer', '300000.00', NULL, 'Berhasil', 'u1', '2026-03-13 15:35:38');
INSERT INTO `spk_payments` (`id`, `spk_id`, `payment_type`, `method`, `amount`, `bank_ref`, `status`, `paid_by`, `created_at`) VALUES (3, 'spk-003', 'DP', 'QRIS', '300000.00', NULL, 'Berhasil', 'u1', '2026-03-13 15:35:38');

-- Structure for table `stock_movements`
DROP TABLE IF EXISTS `stock_movements`;
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

-- Data for table `stock_movements`
INSERT INTO `stock_movements` (`id`, `product_id`, `type`, `qty`, `date`, `reference`, `notes`) VALUES (1, 'prod-dummy-1', 'in', 1, '2026-03-22 11:40:57', 'PURC-1774179657396', 'Restock Barang Masuk');

-- Structure for table `suppliers`
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `suppliers`
INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `address`, `notes`, `created_at`, `updated_at`) VALUES ('b8c0a98b-e476-44a3-a54e-f27e490eaba1', 'ATLANTIK PONOROGO', 'ANING', '081200562456', 'Ponorogo', 'Jadwal kirim setiap hari rabu', '2026-03-22 14:11:34', '2026-03-22 14:11:34');

-- Structure for table `tiered_pricing_rules`
DROP TABLE IF EXISTS `tiered_pricing_rules`;
CREATE TABLE `tiered_pricing_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(50) NOT NULL,
  `min_kuantitas` int(11) NOT NULL,
  `max_kuantitas` int(11) DEFAULT NULL,
  `diskon_persen` decimal(5,2) DEFAULT '0.00',
  `harga_per_unit_akhir` decimal(10,2) NOT NULL,
  `urutan_tier` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `tiered_pricing_rules_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- Data for table `tiered_pricing_rules`
INSERT INTO `tiered_pricing_rules` (`id`, `product_id`, `min_kuantitas`, `max_kuantitas`, `diskon_persen`, `harga_per_unit_akhir`, `urutan_tier`) VALUES (1, 'prod-dummy-1', 1, 10, '0.00', '25000.00', 1);
INSERT INTO `tiered_pricing_rules` (`id`, `product_id`, `min_kuantitas`, `max_kuantitas`, `diskon_persen`, `harga_per_unit_akhir`, `urutan_tier`) VALUES (2, 'prod-dummy-1', 11, 50, '10.00', '22500.00', 2);
INSERT INTO `tiered_pricing_rules` (`id`, `product_id`, `min_kuantitas`, `max_kuantitas`, `diskon_persen`, `harga_per_unit_akhir`, `urutan_tier`) VALUES (3, 'prod-dummy-1', 51, NULL, '25.00', '18750.00', 3);
INSERT INTO `tiered_pricing_rules` (`id`, `product_id`, `min_kuantitas`, `max_kuantitas`, `diskon_persen`, `harga_per_unit_akhir`, `urutan_tier`) VALUES (4, 'prod-dummy-2', 1, 5, '0.00', '35000.00', 1);
INSERT INTO `tiered_pricing_rules` (`id`, `product_id`, `min_kuantitas`, `max_kuantitas`, `diskon_persen`, `harga_per_unit_akhir`, `urutan_tier`) VALUES (5, 'prod-dummy-2', 6, 20, '5.00', '33250.00', 2);
INSERT INTO `tiered_pricing_rules` (`id`, `product_id`, `min_kuantitas`, `max_kuantitas`, `diskon_persen`, `harga_per_unit_akhir`, `urutan_tier`) VALUES (6, 'prod-dummy-2', 21, NULL, '15.00', '29750.00', 3);

-- Structure for table `transaction_details`
DROP TABLE IF EXISTS `transaction_details`;
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

-- Data for table `transaction_details`
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774173465451704', 't1774173465448', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 2, 250, 500, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774173510751947', 't1774173510749', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 2, 250, 500, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774183855106734', 't1774183855102', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 4, 250, 1000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774183908258516', 't1774183908254', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 4, 250, 1000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774328800369781', 't1774328800360', NULL, 'Print CETAK FOTO 3R (Warna)', 1, 3000, 3000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td177437427732492', 't1774374277322', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 4, 250, 1000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774374922292915', 't1774374922291', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 4, 250, 1000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774416180878371', 't1774416180876', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 4, 250, 1000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774432502922163', 't1774432502919', NULL, 'Print PRINT COPY A4 F4 CANON (B/W)', 25, 250, 6250, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774438411961605', 't1774438411959', NULL, 'POLPEN GEL INK PEN', 1, 5000, 5000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td177443841196227', 't1774438411959', NULL, 'Fotocopy HVS F4 (B/W, 1 Sisi)', 10, 250, 2500, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1774971468698825', 't1774971468692', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 3, 250, 750, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1775058089941390', 't1775058089937', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 3, 250, 750, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1775058124135298', 't1775058124133', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 4, 250, 1000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1775124143837626', 't1775124143835', NULL, 'Laminating A4 & F4', 1, 4000, 4000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1775124143837631', 't1775124143835', NULL, 'Print PRIN KERTAS COVER EPSON (B/W)', 1, 1500, 1500, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td17751249390843', 't1775124939081', NULL, 'Fotocopy HVS A4 (B/W, 1 Sisi)', 40, 250, 10000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1775124939085335', 't1775124939081', NULL, 'Print HVS A4 EPSON (Warna)', 1, 1000, 1000, 0);
INSERT INTO `transaction_details` (`id`, `transaction_id`, `product_id`, `name`, `qty`, `price`, `subtotal`, `discount`) VALUES ('td1775124939085341', 't1775124939081', NULL, 'Fotocopy HVS A4 (B/W, Bolak-balik)', 10, 400, 4000, 0);

-- Structure for table `transactions`
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` varchar(50) NOT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT 'Umum',
  `user_id` varchar(50) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'sale',
  `subtotal` int(11) NOT NULL,
  `discount` int(11) DEFAULT '0',
  `total` int(11) NOT NULL,
  `paid` int(11) DEFAULT '0',
  `change_amount` int(11) DEFAULT '0',
  `payment_type` varchar(50) DEFAULT 'tunai',
  `status` varchar(50) DEFAULT 'unpaid',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `customer_id` (`customer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data for table `transactions`
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774173465448', 'TRX-202603-2545', '2026-03-22 02:57:45', NULL, 'Fotocopy Anggun ', 'u1', 'Admin Utama', 'service', 500, 0, 500, 1000, 500, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774173510749', 'TRX-202603-2987', '2026-03-22 02:58:30', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 500, 0, 500, 1000, 500, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774183855102', 'TRX-202603-7418', '2026-03-22 05:50:55', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 1000, 0, 1000, 1000, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774183908254', 'TRX-202603-2152', '2026-03-22 05:51:48', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 1000, 0, 1000, 1000, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774328800360', 'TRX-202603-9614', '2026-03-23 22:06:40', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 3000, 0, 3000, 3000, 0, 'tunai', 'paid');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774374277322', 'TRX-202603-2662', '2026-03-24 10:44:37', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 1000, 0, 1000, 1000, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774374922291', 'TRX-202603-9586', '2026-03-24 10:55:22', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 1000, 0, 1000, 1000, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774416180876', 'TRX-202603-6443', '2026-03-24 22:23:02', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 1000, 0, 1000, 1000, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774432502919', 'TRX-202603-9989', '2026-03-25 02:55:02', NULL, 'nogrek', 'u1', 'Admin Utama', 'service', 6250, 0, 6250, 6250, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774438411959', 'TRX-202603-1505', '2026-03-25 04:33:31', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 7500, 0, 7500, 8000, 500, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1774971468692', 'TRX-202603-8009', '2026-03-31 08:37:48', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 750, 0, 750, 750, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1775058089937', 'TRX-202604-1522', '2026-04-01 08:41:29', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 750, 0, 750, 750, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1775058124133', 'TRX-202604-3417', '2026-04-01 08:42:04', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 1000, 0, 1000, 1000, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1775124143835', 'TRX-202604-4887', '2026-04-02 03:02:23', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 5500, 0, 5500, 5500, 0, 'tunai', 'completed');
INSERT INTO `transactions` (`id`, `invoice_no`, `date`, `customer_id`, `customer_name`, `user_id`, `user_name`, `type`, `subtotal`, `discount`, `total`, `paid`, `change_amount`, `payment_type`, `status`) VALUES ('t1775124939081', 'TRX-202604-8791', '2026-04-02 03:15:39', NULL, 'Umum', 'u1', 'Admin Utama', 'service', 15000, 0, 15000, 15000, 0, 'tunai', 'completed');

-- Structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','kasir','operator','teknisi','desainer') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data for table `users`
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `is_active`, `created_at`) VALUES ('des001', 'Andi Desainer', 'andi_desain', '$2a$10$qH6Xe3vsVF4ZP4ekmECF9ePmwQH3aqbLPjJKRYsbxo9dBx2jC9Kfm', 'desainer', 1, '2026-03-10 12:18:43');
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `is_active`, `created_at`) VALUES ('des002', 'Budi Desainer', 'budi_desain', '$2a$10$./2MZydw8grJfzjbpUdbHuiPk1xh1mriBJhL1LGHVrsBotoHjKwXO', 'desainer', 1, '2026-03-10 12:18:43');
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `is_active`, `created_at`) VALUES ('des1773155248207', 'Supri', 'supri', '$2a$10$Gpt3slKgpqFRnqxIPZnSi.e.KdvUF2DfZNa/r71ltP/6.oyUgC/ZW', 'operator', 1, '2026-03-10 15:07:28');
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `is_active`, `created_at`) VALUES ('u1', 'Admin Utama', 'admin', '$2a$10$sJc8EuUZHYd0PIN9PoJ7v.D8j9IyFVpmVLbqWYmgJJdjIEWgNZwWC', 'admin', 1, '2026-03-09 07:24:14');
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `is_active`, `created_at`) VALUES ('u2', 'Kasir Depan', 'kasir', '$2a$10$nJ91ov6hlHTdswjXsdvgW.lQedMkO6mOAe52HnftxW3GFd56uWTGe', 'kasir', 1, '2026-03-09 07:24:14');
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `is_active`, `created_at`) VALUES ('u3', 'Operator Cetak', 'operator', '$2a$10$vUwRgB40Xe4mamOJhZPyOuJCc3tTjLb/MN5sZcPy2hjffTudz2tR.', 'operator', 1, '2026-03-09 07:24:14');
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `is_active`, `created_at`) VALUES ('u4', 'Teknisi Abadi', 'teknisi', '$2a$10$V1At.JViIPLmIQSoxhbUM.w0BgGUHtqIsXGcNZa8gtH33gdDjsUn.', 'teknisi', 1, '2026-03-09 07:24:14');

-- Structure for table `wa_config`
DROP TABLE IF EXISTS `wa_config`;
CREATE TABLE `wa_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COMMENT='Konfigurasi API WhatsApp';

-- Data for table `wa_config`
INSERT INTO `wa_config` (`id`, `config_key`, `config_value`, `updated_at`) VALUES (1, 'api_url', 'https://api.fonnte.com/send', '2026-03-04 21:16:18');
INSERT INTO `wa_config` (`id`, `config_key`, `config_value`, `updated_at`) VALUES (2, 'api_token', 'admin123', '2026-03-10 13:41:51');
INSERT INTO `wa_config` (`id`, `config_key`, `config_value`, `updated_at`) VALUES (3, 'template_spk_selesai', 'Halo {nama}, pesanan *{produk}* (SPK: {spk_number}) Anda sudah selesai dan siap diambil. Sisa tagihan: *Rp {sisa_tagihan}*. Terima kasih! ?', '2026-03-04 21:16:18');
INSERT INTO `wa_config` (`id`, `config_key`, `config_value`, `updated_at`) VALUES (4, 'template_invoice', 'Halo {nama}, berikut invoice untuk pesanan Anda:

No. SPK: {spk_number}
Produk: {produk}
Total: Rp {total}
DP: Rp {dp}
Sisa: Rp {sisa}

Terima kasih! ?', '2026-03-04 21:16:18');
INSERT INTO `wa_config` (`id`, `config_key`, `config_value`, `updated_at`) VALUES (5, 'auto_notify_on_complete', 'true', '2026-03-04 21:16:18');
INSERT INTO `wa_config` (`id`, `config_key`, `config_value`, `updated_at`) VALUES (7, 'phone_number', '85655620979', '2026-03-10 13:41:51');

