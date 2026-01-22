const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GalleryImage = sequelize.define('GalleryImage', {
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imageUrl: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'general'
    },
    isVisible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    position: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'gallery_images',
    timestamps: true
});

module.exports = GalleryImage;
