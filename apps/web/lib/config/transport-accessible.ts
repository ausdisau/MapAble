export const transportAccessibleConfig = {
  bookingBridgeEnabled:
    process.env.TRANSPORT_BOOKING_BRIDGE_ENABLED === "true",
  ridePoolingEnabled: process.env.TRANSPORT_RIDE_POOLING_ENABLED === "true",
};
