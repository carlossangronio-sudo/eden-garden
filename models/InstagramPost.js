const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InstagramPost = sequelize.define('InstagramPost', {
    postUrl: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    caption: {
        type: DataTypes.STRING,
        allowNull: true
    },
    postType: {
        type: DataTypes.STRING,
        defaultValue: 'post' // post, reel, video
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
    tableName: 'instagram_posts',
    timestamps: true
});

module.exports = InstagramPost;
