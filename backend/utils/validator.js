/**
 * Clasa pentru validarea datelor
 */
class Validator {
    constructor() {
      this.errors = [];
    }
  
    /**
     * Validează existența și tipul unui câmp
     * @param {Object} data - Obiectul de validat
     * @param {string} field - Numele câmpului
     * @param {string} type - Tipul de date așteptat
     * @param {boolean} required - Dacă câmpul este obligatoriu
     * @returns {Validator} Instanța pentru chaining
     */
    validate(data, field, type, required = true) {
      // Verifică dacă câmpul există
      if (required && (data[field] === undefined || data[field] === null)) {
        this.errors.push(`Câmpul "${field}" este obligatoriu`);
        return this;
      }
  
      // Dacă nu e obligatoriu și nu există, nu validăm mai departe
      if (!required && (data[field] === undefined || data[field] === null)) {
        return this;
      }
  
      // Validare în funcție de tip
      switch (type) {
        case 'string':
          if (typeof data[field] !== 'string') {
            this.errors.push(`Câmpul "${field}" trebuie să fie un text`);
          }
          break;
        case 'number':
          if (typeof data[field] !== 'number' || isNaN(data[field])) {
            this.errors.push(`Câmpul "${field}" trebuie să fie un număr`);
          }
          break;
        case 'boolean':
          if (typeof data[field] !== 'boolean') {
            this.errors.push(`Câmpul "${field}" trebuie să fie boolean`);
          }
          break;
        case 'array':
          if (!Array.isArray(data[field])) {
            this.errors.push(`Câmpul "${field}" trebuie să fie o listă`);
          }
          break;
        case 'object':
          if (typeof data[field] !== 'object' || data[field] === null || Array.isArray(data[field])) {
            this.errors.push(`Câmpul "${field}" trebuie să fie un obiect`);
          }
          break;
        case 'date':
          if (isNaN(Date.parse(data[field]))) {
            this.errors.push(`Câmpul "${field}" trebuie să fie o dată validă`);
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof data[field] !== 'string' || !emailRegex.test(data[field])) {
            this.errors.push(`Câmpul "${field}" trebuie să fie o adresă de email validă`);
          }
          break;
        case 'phone':
          const phoneRegex = /^0[0-9]{9}$/;
          if (typeof data[field] !== 'string' || !phoneRegex.test(data[field])) {
            this.errors.push(`Câmpul "${field}" trebuie să fie un număr de telefon valid (format: 07XXXXXXXX)`);
          }
          break;
        default:
          this.errors.push(`Tip de validare necunoscut: ${type}`);
      }
  
      return this;
    }
  
    /**
     * Validează lungimea minimă a unui text
     * @param {Object} data - Obiectul de validat
     * @param {string} field - Numele câmpului
     * @param {number} min - Lungimea minimă
     * @returns {Validator} Instanța pentru chaining
     */
    minLength(data, field, min) {
      if (data[field] !== undefined && data[field] !== null && data[field].length < min) {
        this.errors.push(`Câmpul "${field}" trebuie să aibă minim ${min} caractere`);
      }
      return this;
    }
  
    /**
     * Validează lungimea maximă a unui text
     * @param {Object} data - Obiectul de validat
     * @param {string} field - Numele câmpului
     * @param {number} max - Lungimea maximă
     * @returns {Validator} Instanța pentru chaining
     */
    maxLength(data, field, max) {
      if (data[field] !== undefined && data[field] !== null && data[field].length > max) {
        this.errors.push(`Câmpul "${field}" trebuie să aibă maxim ${max} caractere`);
      }
      return this;
    }
  
    /**
     * Validează valoarea minimă a unui număr
     * @param {Object} data - Obiectul de validat
     * @param {string} field - Numele câmpului
     * @param {number} min - Valoarea minimă
     * @returns {Validator} Instanța pentru chaining
     */
    min(data, field, min) {
      if (data[field] !== undefined && data[field] !== null && data[field] < min) {
        this.errors.push(`Câmpul "${field}" trebuie să fie minim ${min}`);
      }
      return this;
    }
  
    /**
     * Validează valoarea maximă a unui număr
     * @param {Object} data - Obiectul de validat
     * @param {string} field - Numele câmpului
     * @param {number} max - Valoarea maximă
     * @returns {Validator} Instanța pentru chaining
     */
    max(data, field, max) {
      if (data[field] !== undefined && data[field] !== null && data[field] > max) {
        this.errors.push(`Câmpul "${field}" trebuie să fie maxim ${max}`);
      }
      return this;
    }
  
    /**
     * Validează dacă valoarea se află într-o listă de valori acceptate
     * @param {Object} data - Obiectul de validat
     * @param {string} field - Numele câmpului
     * @param {Array} values - Lista de valori acceptate
     * @returns {Validator} Instanța pentru chaining
     */
    enum(data, field, values) {
      if (data[field] !== undefined && data[field] !== null && !values.includes(data[field])) {
        this.errors.push(`Câmpul "${field}" trebuie să fie una din valorile: ${values.join(', ')}`);
      }
      return this;
    }
  
    /**
     * Validează un array de valori
     * @param {Object} data - Obiectul de validat
     * @param {string} field - Numele câmpului
     * @param {Function} validatorFn - Funcția de validare pentru fiecare element
     * @returns {Validator} Instanța pentru chaining
     */
    arrayItems(data, field, validatorFn) {
      if (data[field] !== undefined && data[field] !== null && Array.isArray(data[field])) {
        data[field].forEach((item, index) => {
          try {
            validatorFn(item, index);
          } catch (error) {
            this.errors.push(`Eroare în ${field}[${index}]: ${error.message}`);
          }
        });
      }
      return this;
    }
  
    /**
     * Validează o proprietate a unui obiect
     * @param {Object} data - Obiectul de validat
     * @param {string} field - Numele câmpului
     * @param {Object} schema - Schema de validare pentru subiectul
     * @returns {Validator} Instanța pentru chaining
     */
    objectProps(data, field, schema) {
      if (data[field] && typeof data[field] === 'object' && !Array.isArray(data[field])) {
        const subValidator = new Validator();
        
        Object.entries(schema).forEach(([prop, rules]) => {
          rules.forEach(rule => {
            const [validationType, ...args] = rule;
            if (typeof subValidator[validationType] === 'function') {
              subValidator[validationType]({ [prop]: data[field][prop] }, prop, ...args);
            }
          });
        });
        
        if (subValidator.hasErrors()) {
          this.errors.push(...subValidator.getErrors().map(err => `În câmpul "${field}": ${err}`));
        }
      }
      return this;
    }
  
    /**
     * Verifică dacă există erori de validare
     * @returns {boolean} true dacă există erori, false altfel
     */
    hasErrors() {
      return this.errors.length > 0;
    }
  
    /**
     * Obține lista de erori
     * @returns {Array} Lista de erori
     */
    getErrors() {
      return this.errors;
    }
  
    /**
     * Aruncă o excepție dacă există erori
     * @throws {Error} Eroare cu mesajele de validare
     */
    throwIfErrors() {
      if (this.hasErrors()) {
        const error = new Error('Validation error');
        error.statusCode = 400;
        error.validationErrors = this.errors;
        throw error;
      }
    }
  }
  
  module.exports = Validator;