-- CreateTable
CREATE TABLE `Class` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `crId` INTEGER NOT NULL,
    `vcrId` INTEGER NULL,

    UNIQUE INDEX `Class_crId_key`(`crId`),
    UNIQUE INDEX `Class_vcrId_key`(`vcrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_crId_fkey` FOREIGN KEY (`crId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_vcrId_fkey` FOREIGN KEY (`vcrId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
