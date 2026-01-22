const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantInfo = sequelize.define('RestaurantInfo', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Eden Garden'
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Nice'
    },
    postalCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '06300'
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    whatsappLink: {
        type: DataTypes.STRING,
        allowNull: true
    },
    openingHours: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    heroTagline: {
        type: DataTypes.STRING,
        allowNull: true
    },
    heroDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    atmosphereTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    atmosphereText: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reservationText: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    instagramUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    facebookUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mapUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    menuFullUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reservationExternalUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    orderOnlineUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    whatsappNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Delivery platforms
    uberEatsUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    deliverooUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Private Events
    eventsTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    eventsDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    eventsCapacity: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '50'
    },
    // Google Maps
    mapEmbedUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Images
    heroImageUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    atmosphereImage1Url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    atmosphereImage2Url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    eventsImageUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    logoUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'restaurant_info',
    timestamps: true
});

module.exports = RestaurantInfo;
