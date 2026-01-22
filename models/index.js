const sequelize = require('../config/database');
const RestaurantInfo = require('./RestaurantInfo');
const MenuItem = require('./MenuItem');
const AdminUser = require('./AdminUser');

module.exports = {
    sequelize,
    RestaurantInfo,
    MenuItem,
    AdminUser
};
