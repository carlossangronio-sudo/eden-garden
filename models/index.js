const sequelize = require('../config/database');
const RestaurantInfo = require('./RestaurantInfo');
const MenuItem = require('./MenuItem');
const AdminUser = require('./AdminUser');
const GalleryImage = require('./GalleryImage');
const InstagramPost = require('./InstagramPost');

module.exports = {
    sequelize,
    RestaurantInfo,
    MenuItem,
    AdminUser,
    GalleryImage,
    InstagramPost
};
