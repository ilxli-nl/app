-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `job` VARCHAR(191) NULL,
    `img` VARCHAR(191) NULL,
    `cover` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Images` (
    `ean` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Images_ean_key`(`ean`),
    PRIMARY KEY (`ean`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Labels` (
    `order` VARCHAR(191) NOT NULL,
    `Name` VARCHAR(191) NOT NULL,
    `Address` VARCHAR(191) NOT NULL,
    `Barcode` VARCHAR(191) NULL,

    UNIQUE INDEX `Labels_order_key`(`order`),
    PRIMARY KEY (`order`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token` (
    `id` VARCHAR(191) NOT NULL,
    `dbtoken` VARCHAR(191) NULL,
    `account` VARCHAR(191) NOT NULL,
    `dbtime` VARCHAR(191) NULL,

    UNIQUE INDEX `token_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orders` (
    `orderId` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `account` VARCHAR(191) NOT NULL,
    `dateTimeOrderPlaced` VARCHAR(191) NULL,
    `s_salutationCode` VARCHAR(191) NOT NULL,
    `s_firstName` VARCHAR(191) NOT NULL,
    `s_surname` VARCHAR(191) NOT NULL,
    `s_streetName` VARCHAR(191) NOT NULL,
    `s_houseNumber` VARCHAR(191) NOT NULL,
    `s_houseNumberExtension` VARCHAR(191) NULL,
    `s_zipCode` VARCHAR(191) NOT NULL,
    `s_city` VARCHAR(191) NOT NULL,
    `s_countryCode` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NULL,
    `b_salutationCode` VARCHAR(191) NULL,
    `b_firstName` VARCHAR(191) NULL,
    `b_surname` VARCHAR(191) NULL,
    `b_streetName` VARCHAR(191) NULL,
    `b_houseNumber` VARCHAR(191) NULL,
    `b_houseNumberExtension` VARCHAR(191) NULL,
    `b_zipCode` VARCHAR(191) NULL,
    `b_city` VARCHAR(191) NULL,
    `b_countryCode` VARCHAR(191) NULL,
    `b_company` VARCHAR(191) NULL,
    `offerId` VARCHAR(191) NULL,
    `ean` VARCHAR(191) NULL,
    `title` VARCHAR(500) NOT NULL,
    `img` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `quantity` INTEGER NULL,
    `unitPrice` DOUBLE NULL,
    `commission` DOUBLE NULL,
    `latestDeliveryDate` DATETIME(3) NULL,
    `exactDeliveryDate` DATETIME(3) NULL,
    `expiryDate` DATETIME(3) NULL,
    `offerCondition` VARCHAR(191) NULL,
    `cancelRequest` VARCHAR(191) NULL,
    `method` VARCHAR(191) NULL,
    `distributionParty` VARCHAR(191) NULL,
    `fulfilled` VARCHAR(191) NULL,
    `qls_time` DATETIME(3) NULL,

    UNIQUE INDEX `Orders_orderItemId_key`(`orderItemId`),
    PRIMARY KEY (`orderItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
