CREATE TABLE `pricing_sso_used_tokens` (
  `jti` varchar(128) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  PRIMARY KEY (`jti`),
  KEY `pricing_sso_used_tokens_expiresAt_idx` (`expiresAt`)
);
