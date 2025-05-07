const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');

/**
 * Serviciul pentru manipularea bazei de date JSON
 */
class DbService {
  /**
   * Citește datele din baza de date JSON
   * @returns {Promise<Object>} Datele din baza de date
   */
  async readDb() {
    try {
      const data = await fs.readFile(dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      throw new Error('Database read error');
    }
  }

  /**
   * Scrie datele în baza de date JSON
   * @param {Object} data - Datele de scris în baza de date
   * @returns {Promise<void>}
   */
  async writeDb(data) {
    try {
      await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing to database:', error);
      throw new Error('Database write error');
    }
  }

  /**
   * Obține toate înregistrările dintr-o colecție
   * @param {string} collection - Numele colecției (clients, cars, etc.)
   * @returns {Promise<Array>} Lista de înregistrări
   */
  async getAll(collection) {
    const db = await this.readDb();
    return db[collection] || [];
  }

  /**
   * Obține o înregistrare după ID
   * @param {string} collection - Numele colecției
   * @param {number} id - ID-ul înregistrării
   * @returns {Promise<Object|null>} Înregistrarea găsită sau null
   */
  async getById(collection, id) {
    const db = await this.readDb();
    return db[collection]?.find(item => item.id === parseInt(id)) || null;
  }

  /**
   * Caută înregistrări după filtru
   * @param {string} collection - Numele colecției
   * @param {Object} filter - Criterii de filtrare
   * @returns {Promise<Array>} Lista de înregistrări filtrate
   */
  async find(collection, filter) {
    const db = await this.readDb();
    if (!db[collection]) return [];

    return db[collection].filter(item => {
      return Object.keys(filter).every(key => {
        if (typeof filter[key] === 'object' && filter[key] !== null) {
          if (Array.isArray(filter[key])) {
            return filter[key].includes(item[key]);
          }
          return Object.keys(filter[key]).every(subKey => {
            return item[key] && item[key][subKey] === filter[key][subKey];
          });
        }
        return item[key] === filter[key];
      });
    });
  }

  /**
   * Creează o nouă înregistrare
   * @param {string} collection - Numele colecției
   * @param {Object} data - Datele de inserat
   * @returns {Promise<Object>} Înregistrarea creată
   */
  async create(collection, data) {
    const db = await this.readDb();
    
    if (!db[collection]) {
      db[collection] = [];
    }
    
    // Generează un ID nou
    const newId = db[collection].length > 0 
      ? Math.max(...db[collection].map(item => item.id)) + 1 
      : 1;
    
    // Adaugă timestamp-uri
    const now = new Date().toISOString();
    const newItem = {
      id: newId,
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    db[collection].push(newItem);
    await this.writeDb(db);
    
    return newItem;
  }

  /**
   * Actualizează o înregistrare
   * @param {string} collection - Numele colecției
   * @param {number} id - ID-ul înregistrării
   * @param {Object} data - Datele de actualizat
   * @returns {Promise<Object|null>} Înregistrarea actualizată sau null dacă nu există
   */
  async update(collection, id, data) {
    const db = await this.readDb();
    
    if (!db[collection]) return null;
    
    const index = db[collection].findIndex(item => item.id === parseInt(id));
    if (index === -1) return null;
    
    // Actualizare date
    const updatedItem = {
      ...db[collection][index],
      ...data,
      id: parseInt(id), // Asigură că ID-ul rămâne neschimbat
      updatedAt: new Date().toISOString()
    };
    
    db[collection][index] = updatedItem;
    await this.writeDb(db);
    
    return updatedItem;
  }

  /**
   * Șterge o înregistrare
   * @param {string} collection - Numele colecției
   * @param {number} id - ID-ul înregistrării
   * @returns {Promise<boolean>} true dacă ștergerea a reușit, false altfel
   */
  async delete(collection, id) {
    const db = await this.readDb();
    
    if (!db[collection]) return false;
    
    const initialLength = db[collection].length;
    db[collection] = db[collection].filter(item => item.id !== parseInt(id));
    
    if (db[collection].length === initialLength) return false;
    
    await this.writeDb(db);
    return true;
  }

  /**
   * Activează/dezactivează o înregistrare
   * @param {string} collection - Numele colecției
   * @param {number} id - ID-ul înregistrării
   * @param {boolean} active - Starea de activare
   * @returns {Promise<Object|null>} Înregistrarea actualizată sau null
   */
  async toggleActive(collection, id, active) {
    return this.update(collection, id, { active });
  }
}

module.exports = new DbService();