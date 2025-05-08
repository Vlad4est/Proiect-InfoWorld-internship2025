const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

/**
 * Generează hash pentru o parolă
 * @param {string} password - Parola în text simplu
 * @returns {Promise<string>} Hash-ul parolei
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Rulează script-ul de populare a bazei de date
 */
async function populateDb() {
  try {
    // Hash-uiește parola
    const hashedPassword = await hashPassword('password123');

    // Structura bazei de date
    const db = {
      admins: [
        {
          id: 1,
          username: "admin",
          password: hashedPassword,
          firstName: "Administrator",
          lastName: "Principal",
          email: "admin@serviceauto.ro",
          role: "admin",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          username: "tehnician",
          password: hashedPassword,
          firstName: "Mihai",
          lastName: "Tehnician",
          email: "mihai.tehnician@serviceauto.ro",
          role: "tehnician",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      clients: [
        {
          id: 1,
          username: "ion.popescu",
          password: hashedPassword,
          firstName: "Ion",
          lastName: "Popescu",
          phoneNumbers: ["0722123456", "0312345678"],
          email: "ion.popescu@email.com",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          username: "maria.ionescu",
          password: hashedPassword,
          firstName: "Maria",
          lastName: "Ionescu",
          phoneNumbers: ["0733987654"],
          email: "maria.ionescu@email.com",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          username: "andrei.dumitrescu",
          password: hashedPassword,
          firstName: "Andrei",
          lastName: "Dumitrescu",
          phoneNumbers: ["0744555666"],
          email: "andrei.dumitrescu@email.com",
          active: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      cars: [
        {
          id: 1,
          clientId: 1,
          licensePlate: "B 123 ABC",
          chassisNumber: "WVWZZZ1JZXW123456",
          brand: "Volkswagen",
          model: "Golf",
          year: 2020,
          engineType: "diesel",
          engineCapacity: 1968,
          horsePower: 150,
          powerKW: 110,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          clientId: 1,
          licensePlate: "B 456 DEF",
          chassisNumber: "WVWZZZ1JZXW789012",
          brand: "Audi",
          model: "A4",
          year: 2022,
          engineType: "hybrid",
          engineCapacity: 2000,
          horsePower: 204,
          powerKW: 150,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          clientId: 2,
          licensePlate: "CJ 01 MAR",
          chassisNumber: "WBAXXX1234567890",
          brand: "BMW",
          model: "X5",
          year: 2021,
          engineType: "diesel",
          engineCapacity: 3000,
          horsePower: 286,
          powerKW: 210,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 4,
          clientId: 3,
          licensePlate: "B 999 ZZZ",
          chassisNumber: "TMBZZZ1234567890",
          brand: "Skoda",
          model: "Octavia",
          year: 2019,
          engineType: "benzina",
          engineCapacity: 1500,
          horsePower: 150,
          powerKW: 110,
          active: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      appointments: [
        {
          id: 1,
          clientId: 1,
          carId: 1,
          date: "2025-05-10",
          startTime: "10:00",
          endTime: "11:30",
          duration: 90,
          description: "Revizie anuală",
          contactMethod: "telefon",
          status: "programat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          clientId: 2,
          carId: 3,
          date: "2025-05-11",
          startTime: "09:00",
          endTime: "12:00",
          duration: 180,
          description: "Schimb plăcuțe frână, verificare suspensie",
          contactMethod: "email",
          status: "programat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      serviceRecords: [
        {
          id: 1,
          appointmentId: 1,
          reception: {
            visualIssues: "Zgârietură portieră dreapta, far spart",
            clientReportedIssues: "Zgomot suspensie, probleme la frânare",
            receivedAt: new Date().toISOString(),
            receivedBy: "Mihai Tehnician"
          },
          processing: {
            operations: [
              "Schimb ulei și filtre",
              "Verificare și reglare frâne",
              "Diagnosticare suspensie"
            ],
            replacedParts: [
              {
                name: "Ulei motor",
                quantity: 5,
                unitPrice: 60
              },
              {
                name: "Filtru ulei",
                quantity: 1,
                unitPrice: 45
              },
              {
                name: "Filtru aer",
                quantity: 1,
                unitPrice: 75
              }
            ],
            additionalIssues: "Amortizor față dreapta uzat, necesită înlocuire",
            repaired: "parțial",
            processingDuration: 80,
            processedAt: new Date().toISOString(),
            processedBy: "Alex Mecanic"
          },
          completed: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      parts: [
        {
          id: 1,
          name: "Ulei motor 5W30",
          category: "Uleiuri",
          stock: 30,
          unitPrice: 60,
          unitType: "litru",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Filtru ulei universal",
          category: "Filtre",
          stock: 25,
          unitPrice: 45,
          unitType: "bucată",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          name: "Filtru aer Golf 7",
          category: "Filtre",
          stock: 15,
          unitPrice: 75,
          unitType: "bucată",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 4,
          name: "Plăcuțe frână față BMW X5",
          category: "Frâne",
          stock: 8,
          unitPrice: 450,
          unitType: "set",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 5,
          name: "Amortizor față Golf",
          category: "Suspensie",
          stock: 4,
          unitPrice: 350,
          unitType: "bucată",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };

    // Scrie fișierul db.json
    const dbPath = path.join(__dirname,  'db.json');
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8');

    console.log('Baza de date a fost populată cu succes!');
    console.log('Locația fișierului db.json:', dbPath);
    console.log('\nUtilizatori generați:');
    console.log('- Admin: username=admin, password=password123');
    console.log('- Tehnician: username=tehnician, password=password123');
    console.log('- Client: username=ion.popescu, password=password123');
    console.log('- Client: username=maria.ionescu, password=password123');

  } catch (error) {
    console.error('Eroare la popularea bazei de date:', error);
    process.exit(1);
  }
}

// Rulează funcția
populateDb();