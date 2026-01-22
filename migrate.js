require('dotenv').config();
const { sequelize } = require('./models');

async function migrate() {
    try {
        console.log('Migration en cours...\n');

        // Ajouter les nouvelles colonnes si elles n'existent pas
        const queries = [
            `ALTER TABLE restaurant_info ADD COLUMN uberEatsUrl TEXT;`,
            `ALTER TABLE restaurant_info ADD COLUMN deliverooUrl TEXT;`,
            `ALTER TABLE restaurant_info ADD COLUMN eventsTitle TEXT;`,
            `ALTER TABLE restaurant_info ADD COLUMN eventsDescription TEXT;`,
            `ALTER TABLE restaurant_info ADD COLUMN eventsCapacity TEXT DEFAULT '50';`,
            `ALTER TABLE restaurant_info ADD COLUMN mapEmbedUrl TEXT;`,
            // Images
            `ALTER TABLE restaurant_info ADD COLUMN heroImageUrl TEXT;`,
            `ALTER TABLE restaurant_info ADD COLUMN atmosphereImage1Url TEXT;`,
            `ALTER TABLE restaurant_info ADD COLUMN atmosphereImage2Url TEXT;`,
            `ALTER TABLE restaurant_info ADD COLUMN eventsImageUrl TEXT;`,
            `ALTER TABLE restaurant_info ADD COLUMN logoUrl TEXT;`
        ];

        for (const query of queries) {
            try {
                await sequelize.query(query);
                console.log('OK:', query.substring(0, 60) + '...');
            } catch (err) {
                if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
                    console.log('SKIP (existe deja):', query.substring(30, 70));
                } else {
                    console.log('SKIP:', err.message);
                }
            }
        }

        console.log('\nMigration terminee!');
        console.log('Redemarre le serveur: npm start\n');

        process.exit(0);
    } catch (error) {
        console.error('Erreur de migration:', error);
        process.exit(1);
    }
}

migrate();
