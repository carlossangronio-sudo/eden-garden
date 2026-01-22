const { sequelize, RestaurantInfo } = require('./models');

async function updateFields() {
    try {
        // Sync the model to add new columns
        await sequelize.sync({ alter: true });

        const info = await RestaurantInfo.findOne();
        if (!info) {
            console.log('No restaurant info found');
            process.exit(1);
        }

        await info.update({
            menuFullUrl: '',
            reservationExternalUrl: 'https://www.foodbooking.com/ordering/restaurant/menu/reservation?restaurant_uid=00d39f5a-6378-453f-af2c-74e234807a29&reservation=true',
            orderOnlineUrl: 'https://www.foodbooking.com/ordering/restaurant/menu?restaurant_uid=00d39f5a-6378-453f-af2c-74e234807a29',
            whatsappNumber: '33652826430'
        });

        console.log('New fields added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

updateFields();
