-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
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
    `orderItemId` VARCHAR(191) NOT NULL,
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
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
<<<<<<<< HEAD:prisma/migrations/20250625124418_init/migration.sql
>>>>>>> parent of 868da02 (Warehouse managment)
=======
<<<<<<<< HEAD:prisma/migrations/20250625124418_init/migration.sql
<<<<<<<< HEAD:prisma/migrations/20250625124418_init/migration.sql
>>>>>>> parent of 868da02 (Warehouse managment)
<<<<<<<< HEAD:prisma/migrations/20250625124418_init/migration.sql

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `ean` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_ean_key`(`ean`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WarehouseLocation` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WarehouseLocation_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductLocation` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductLocation_productId_locationId_key`(`productId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductLocationHistory` (
    `id` VARCHAR(191) NOT NULL,
    `recordId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `field` VARCHAR(191) NULL,
    `oldValue` VARCHAR(191) NULL,
    `newValue` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `productLocationId` VARCHAR(191) NULL,

    INDEX `ProductLocationHistory_recordId_idx`(`recordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductLocation` ADD CONSTRAINT `ProductLocation_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductLocation` ADD CONSTRAINT `ProductLocation_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `WarehouseLocation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductLocationHistory` ADD CONSTRAINT `ProductLocationHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductLocationHistory` ADD CONSTRAINT `ProductLocationHistory_productLocationId_fkey` FOREIGN KEY (`productLocationId`) REFERENCES `ProductLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
========
>>>>>>>> parent of 868da02 (Warehouse managment):prisma/migrations/20250606103345_init/migration.sql
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> parent of 868da02 (Warehouse managment)
=======
========
>>>>>>>> parent of 868da02 (Warehouse managment):prisma/migrations/20250606103345_init/migration.sql
>>>>>>> parent of 868da02 (Warehouse managment)
=======
========
>>>>>>>> parent of 868da02 (Warehouse managment):prisma/migrations/20250606103345_init/migration.sql
========
>>>>>>>> parent of 868da02 (Warehouse managment):prisma/migrations/20250606103345_init/migration.sql
>>>>>>> parent of 868da02 (Warehouse managment)
