// Route de seed pour Vercel - Debug version
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = async (req, res) => {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log('1. Seed started');

        // Vérifier DATABASE_URL
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        log('2. DATABASE_URL exists: ' + !!dbUrl);

        if (!dbUrl) {
            return res.status(500).json({
                error: 'DATABASE_URL non définie',
                logs
            });
        }

        log('3. Creating Sequelize connection...');

        // Connexion directe sans passer par models
        const sequelize = new Sequelize(dbUrl, {
            dialect: 'postgres',
            dialectOptions: {
                ssl: { rejectUnauthorized: false }
            },
            logging: false
        });

        log('4. Testing connection...');
        await sequelize.authenticate();
        log('5. Database connected!');

        // Créer les tables manuellement
        log('6. Creating tables...');

        await sequelize.query(`
            DROP TABLE IF EXISTS menu_items CASCADE;
            DROP TABLE IF EXISTS admin_users CASCADE;
            DROP TABLE IF EXISTS restaurant_info CASCADE;
            DROP TABLE IF EXISTS session CASCADE;
        `);
        log('7. Old tables dropped');

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                "passwordHash" VARCHAR(255) NOT NULL,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        log('8. admin_users table created');

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS restaurant_info (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) DEFAULT 'Eden Garden',
                address VARCHAR(255),
                city VARCHAR(255) DEFAULT 'Nice',
                "postalCode" VARCHAR(20) DEFAULT '06300',
                phone VARCHAR(50),
                email VARCHAR(255),
                "whatsappLink" TEXT,
                "openingHours" TEXT,
                "heroTagline" VARCHAR(255),
                "heroDescription" TEXT,
                "atmosphereTitle" VARCHAR(255),
                "atmosphereText" TEXT,
                "reservationText" TEXT,
                "instagramUrl" TEXT,
                "facebookUrl" TEXT,
                "mapUrl" TEXT,
                "menuFullUrl" TEXT,
                "reservationExternalUrl" TEXT,
                "orderOnlineUrl" TEXT,
                "whatsappNumber" VARCHAR(50),
                "uberEatsUrl" TEXT,
                "deliverooUrl" TEXT,
                "eventsTitle" VARCHAR(255),
                "eventsDescription" TEXT,
                "eventsCapacity" VARCHAR(20) DEFAULT '50',
                "mapEmbedUrl" TEXT,
                "heroImageUrl" TEXT,
                "atmosphereImage1Url" TEXT,
                "atmosphereImage2Url" TEXT,
                "eventsImageUrl" TEXT,
                "logoUrl" TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        log('9. restaurant_info table created');

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                "imageUrl" TEXT,
                category VARCHAR(100),
                "isVisible" BOOLEAN DEFAULT true,
                position INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        log('10. menu_items table created');

        // Créer admin
        log('11. Creating admin user...');
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@edengarden.fr';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        log('12. Admin email: ' + adminEmail);

        const passwordHash = await bcrypt.hash(adminPassword, 10);
        log('13. Password hashed');

        await sequelize.query(`
            INSERT INTO admin_users (email, "passwordHash")
            VALUES ($1, $2)
        `, {
            bind: [adminEmail, passwordHash]
        });
        log('14. Admin user inserted');

        // Créer restaurant info
        log('15. Creating restaurant info...');
        await sequelize.query(`
            INSERT INTO restaurant_info (name, address, city, "postalCode", phone, "openingHours", "heroTagline", "heroDescription")
            VALUES ('Eden Garden', '30 Quai Lunel', 'Nice', '06300', '04 93 XX XX XX', 'Mer-Dim: 12h-00h30', 'Nice Port · France', 'Restaurant Bar Lounge & Chicha Premium')
        `);
        log('16. Restaurant info inserted');

        // Créer menu items
        log('17. Creating menu items...');
        await sequelize.query(`
            INSERT INTO menu_items (title, description, price, category, "isVisible", position)
            VALUES
                ('Poulet Yassa', 'Cuisse de poulet marinée', 18.00, 'Plat', true, 1),
                ('Rougail Saucisse', 'Saucisses fumées', 19.00, 'Plat', true, 2),
                ('Mix Grill Eden', 'Assortiment royal', 28.00, 'Plat', true, 3)
        `);
        log('18. Menu items inserted');

        await sequelize.close();
        log('19. SEED COMPLETE!');

        return res.status(200).json({
            success: true,
            message: 'Seed terminé!',
            admin: adminEmail,
            logs
        });

    } catch (error) {
        log('ERROR: ' + error.message);
        return res.status(500).json({
            error: error.message,
            stack: error.stack,
            logs
        });
    }
};
