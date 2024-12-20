import { generateOTP, PgFormData } from '../src/utility'; // Adjust the import path as needed

describe('generateOTP', () => {
  // Test for valid OTP lengths
  it('should generate an OTP with the specified length', () => {
    const otp6 = generateOTP(6);
    expect(otp6).toHaveLength(6);
    expect(/^\d{6}$/.test(otp6)).toBe(true); // Ensure OTP consists of exactly 6 digits

    const otp8 = generateOTP(8);
    expect(otp8).toHaveLength(8);
    expect(/^\d{8}$/.test(otp8)).toBe(true); // Ensure OTP consists of exactly 8 digits
  });

  // Test for invalid OTP lengths (less than 4)
  it('should throw an error if the OTP length is less than 4', () => {
    expect(() => generateOTP(3)).toThrow('The length of the OTP must be a positive integer greater than or equal to 4.');
  });

  // Test for invalid non-integer OTP length
  it('should throw an error if the OTP length is not an integer', () => {
    expect(() => generateOTP(4.5)).toThrow('The length of the OTP must be a positive integer greater than or equal to 4.');
  });

  // Test for random OTPs
  it('should generate a different OTP each time', () => {
    const otp1 = generateOTP(6);
    const otp2 = generateOTP(6);
    expect(otp1).not.toBe(otp2); // Ensure OTPs are different
  });

  // Test for OTPs that consist only of digits
  it('should generate OTPs containing only digits', () => {
    const otp = generateOTP(6);
    expect(/^\d{6}$/.test(otp)).toBe(true); // Ensure OTP consists of digits only
  });
});


describe('PgFormData', () => {
  // Test case for correct order of values with object stringification and undefined replaced by null
  it('should return form values in the correct order, stringify objects, and replace undefined with null', () => {
    const data = {
      name: 'John',
      age: 30,
      address: undefined,
      preferences: { color: 'blue', language: 'en' }
    };
    const order = ['name', 'age', 'address', 'preferences'];
    const formData = new PgFormData(data, order);

    expect(formData.values).toEqual([
      'John',  // name
      30,      // age
      null,    // address (undefined value replaced with null)
      '{"color":"blue","language":"en"}'  // preferences (stringified object)
    ]);
  });

  // Test case when some fields are missing (undefined) and objects are stringified
  it('should return null for missing fields and stringify objects correctly', () => {
    const data = {
      name: 'Alice',
      age: undefined,
      address: '123 Main St',
      preferences: { theme: 'dark' }
    };
    const order = ['name', 'age', 'address', 'preferences'];
    const formData = new PgFormData(data, order);

    expect(formData.values).toEqual([
      'Alice',                     // name
      null,                        // age (undefined replaced with null)
      '123 Main St',               // address
      '{"theme":"dark"}'           // preferences (stringified object)
    ]);
  });

  // Test case when all fields are defined and objects are stringified
  it('should return all values in the correct order and stringify objects', () => {
    const data = {
      name: 'Bob',
      age: 25,
      address: '456 Elm St',
      preferences: { theme: 'light' }
    };
    const order = ['name', 'age', 'address', 'preferences'];
    const formData = new PgFormData(data, order);

    expect(formData.values).toEqual([
      'Bob',                        // name
      25,                           // age
      '456 Elm St',                 // address
      '{"theme":"light"}'           // preferences (stringified object)
    ]);
  });

  // Test case when the order has extra fields not present in data
  it('should return null for fields in order not present in data', () => {
    const data = { name: 'Charlie', age: 28 };
    const order = ['name', 'age', 'address']; // 'address' is not in data
    const formData = new PgFormData(data, order);

    expect(formData.values).toEqual([
      'Charlie',   // name
      28,          // age
      null         // address (missing field replaced with null)
    ]);
  });

  // Test case with an empty data object
  it('should return null for all fields when data is empty', () => {
    const data = {};
    const order = ['name', 'age', 'address'];
    const formData = new PgFormData(data, order);

    expect(formData.values).toEqual([null, null, null]);  // All null values
  });

  // Test case with an empty order array
  it('should return an empty array when order is empty', () => {
    const data = { name: 'Daniel', age: 35, address: '789 Oak St' };
    const order: string[] = []; // No order provided
    const formData = new PgFormData(data, order);

    expect(formData.values).toEqual([]);  // Empty array since no order is provided
  });
});


