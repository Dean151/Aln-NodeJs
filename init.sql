SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `alerts` (
  `id` int(11) UNSIGNED NOT NULL,
  `feeder` int(11) UNSIGNED NOT NULL,
  `type` varchar(64) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data` blob
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `feeders` (
  `id` int(11) UNSIGNED NOT NULL,
  `identifier` varchar(16) NOT NULL,
  `name` varchar(128) NOT NULL,
  `owner` int(11) UNSIGNED DEFAULT NULL,
  `ip` varchar(64) NOT NULL,
  `last_responded` datetime NOT NULL,
  `default_value` tinyint(3) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `meals` (
  `id` int(11) UNSIGNED NOT NULL,
  `feeder` int(11) UNSIGNED DEFAULT NULL,
  `planning` int(11) UNSIGNED DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time NOT NULL,
  `quantity` tinyint(3) UNSIGNED NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `plannings` (
  `id` int(11) UNSIGNED NOT NULL,
  `feeder` int(11) UNSIGNED NOT NULL,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `unknown_data` (
  `id` int(11) UNSIGNED NOT NULL,
  `date` datetime NOT NULL,
  `type` varchar(64) NOT NULL,
  `ip` varchar(64) NOT NULL,
  `data` blob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `users` (
  `id` int(11) UNSIGNED NOT NULL,
  `apple_id` varchar(128) DEFAULT NULL,
  `email` varchar(254) CHARACTER SET utf8 NOT NULL,
  `email_shown` varchar(254) NOT NULL,
  `register` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE `alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `feeder` (`feeder`);

ALTER TABLE `feeders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identifier` (`identifier`),
  ADD KEY `feeder_owner` (`owner`);

ALTER TABLE `meals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `planning` (`planning`),
  ADD KEY `feeder` (`feeder`);

ALTER TABLE `plannings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `feeder` (`feeder`);

ALTER TABLE `unknown_data`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `apple_id` (`apple_id`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `alerts`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `feeders`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `meals`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `plannings`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `unknown_data`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `alerts`
  ADD CONSTRAINT `alert_feeder` FOREIGN KEY (`feeder`) REFERENCES `feeders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `feeders`
  ADD CONSTRAINT `feeder_owner` FOREIGN KEY (`owner`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE SET NULL;

ALTER TABLE `meals`
  ADD CONSTRAINT `feeder_ref` FOREIGN KEY (`feeder`) REFERENCES `feeders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `planning` FOREIGN KEY (`planning`) REFERENCES `plannings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `plannings`
  ADD CONSTRAINT `feeder` FOREIGN KEY (`feeder`) REFERENCES `feeders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
