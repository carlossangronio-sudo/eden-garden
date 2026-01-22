require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, RestaurantInfo, MenuItem, AdminUser } = require('../models');

async function seed() {
    try {
        // Sync database (force: true will drop existing tables)
        await sequelize.sync({ force: true });
        console.log('Database synchronized');

        // Create admin user from environment variables
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@edengarden.fr';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (adminPassword === 'admin123') {
            console.log('\n[AVERTISSEMENT] Vous utilisez le mot de passe par defaut!');
            console.log('Changez ADMIN_PASSWORD dans .env avant la mise en production.\n');
        }

        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await AdminUser.create({
            email: adminEmail,
            passwordHash
        });
        console.log('Admin user created:', adminEmail);

        // Create restaurant info
        await RestaurantInfo.create({
            name: 'Eden Garden',
            address: '30 Quai Lunel',
            city: 'Nice',
            postalCode: '06300',
            phone: '04 93 XX XX XX',
            whatsappLink: '',
            openingHours: 'Mer-Dim: 12h-00h30 | Lun-Mar: Ferme',
            heroTagline: 'Nice Port · France',
            heroDescription: 'Une fusion audacieuse entre la gastronomie afro-reunionnaise et l\'elegance de la vie nocturne azureenne. Restaurant, Bar Lounge & Chicha Premium.',
            atmosphereTitle: 'Plus qu\'un restaurant, un lieu de vie.',
            atmosphereText: 'L\'Eden Garden redefinit vos soirees a Nice. Commencez par un diner aux saveurs epicees, poursuivez avec un cocktail creatif sur notre terrasse face au port, et terminez en beaute avec une chicha Kaloud premium devant les plus grands matchs.',
            reservationText: 'Pour le diner ou pour le lounge, assurez-vous d\'avoir la meilleure place. Reservation instantanee sans prepaiement.',
            instagramUrl: 'https://instagram.com/edengardennice',
            facebookUrl: 'https://facebook.com/edengardennice',
            mapUrl: 'https://maps.google.com/?q=30+Quai+Lunel+06300+Nice',
            // Delivery platforms
            uberEatsUrl: 'https://www.ubereats.com/fr/store/eden-garden/QWGcdg7XWze-UTEhFUTC0A',
            deliverooUrl: 'https://deliveroo.fr/fr/menu/nice/nice-vieux-nice/eden-garden-nice',
            // Events
            eventsTitle: 'Privatisez l\'Eden pour vos moments uniques',
            eventsDescription: 'Anniversaires, afterworks, soirees privees, evenements d\'entreprise... Notre equipe vous accompagne pour creer une experience sur mesure dans un cadre exceptionnel face au Port de Nice.',
            eventsCapacity: '50'
        });
        console.log('Restaurant info created');

        // Create menu items from original HTML
        const menuItems = [
            {
                title: 'Poulet Yassa',
                description: 'Cuisse de poulet marinée au citron vert, oignons confits, olives, servi avec riz blanc parfumé.',
                price: 18.00,
                imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                category: 'Plat',
                isVisible: true,
                position: 1
            },
            {
                title: 'Rougail Saucisse',
                description: 'Saucisses fumées traditionnelles, mijotées dans une sauce tomate aux épices réunionnaises.',
                price: 19.00,
                imageUrl: 'https://images.unsplash.com/photo-1594910091040-5b481358c279?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                category: 'Plat',
                isVisible: true,
                position: 2
            },
            {
                title: 'Mix Grill Eden',
                description: 'Assortiment royal : Agneau, Poulet, Merguez, accompagné d\'alloco et sauce verte maison.',
                price: 28.00,
                imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                category: 'Plat',
                isVisible: true,
                position: 3
            },
            {
                title: 'Signature Cocktails',
                description: 'Découvrez notre carte de cocktails créatifs, avec ou sans alcool.',
                price: 12.00,
                imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                category: 'Cocktail',
                isVisible: true,
                position: 4
            }
        ];

        await MenuItem.bulkCreate(menuItems);
        console.log('Menu items created');

        console.log('\n✅ Seed completed successfully!');
        console.log('You can now start the server with: npm start');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
