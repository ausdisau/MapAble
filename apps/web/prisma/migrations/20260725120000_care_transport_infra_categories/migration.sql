-- AlterEnum: Care + Transport infrastructure place categories
ALTER TYPE "AccessPlaceCategory" ADD VALUE IF NOT EXISTS 'care_support_hub';
ALTER TYPE "AccessPlaceCategory" ADD VALUE IF NOT EXISTS 'accessible_pickup_point';
ALTER TYPE "AccessPlaceCategory" ADD VALUE IF NOT EXISTS 'transport_depot';
