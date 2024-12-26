/**
 * Generates a random One-Time Password (OTP) of a specified length.
 *
 * This utility function generates a random OTP using digits from 0 to 9. The length of the OTP is determined by the 
 * provided `num` parameter. The OTP length must be at least 4 digits.
 *
 * @param {number} num - The length of the OTP to generate. Must be a positive integer greater than or equal to 4.
 * @returns {string} A string representing the randomly generated OTP with the specified length.
 *
 * @example
 * const otp = generateOTP(6);
 * console.log(otp); // Example Output: "483920"
 *
 * @throws {Error} Will throw an error if `num` is less than 4 or not a positive integer.
 */
export function generateOTP(num: number): string {
    if (num < 4 || !Number.isInteger(num)) {
        throw new Error("The length of the OTP must be a positive integer greater than or equal to 4.");
    }

    const digits = "0123456789";
    let OTP = "";

    for (let i = 0; i < num; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }

    return OTP;
}

export type Message = {
  status: "success" | "error",
  message: string,
  data?: object
}


/**
 * A class to manage form data for database queries, maintaining a specific order of the values.
 * 
 * This class stores the form data in a `data` object, where keys represent field names, 
 * and the values are the corresponding values of the fields. The `order` array is used to 
 * ensure that the values are returned in a specific order.
 */
export class PgFormData {
    private data: Record<string, any>;
    private order: string[];
  
    /**
     * Creates an instance of the PgFormData class.
     *
     * @param {object} data - The form data where keys are field names and values are the field values.
     * @param {string[]} order - The order in which the values should be returned.
     */
    constructor(data: object, order: string[]) {
      this.data = data;
      this.order = order;
    }
  
    /**
     * Returns the form values in the specified order for database query purposes.
     * 
     * If a field's value is an object, it will be converted to a JSON string.
     * If a field's value is `undefined`, it will be replaced with `null`.
     *
     * @returns {Array<any>} - The form values in the specified order, with `null` for undefined values and 
     *                          JSON strings for objects.
     */
    get values(): Array<any> {
      return this.order.map((key) => {
        const value = this.data[key];
        if (value === undefined) {
          return null;
        } else if (value !== null && typeof value === 'object') {
          return JSON.stringify(value); // Stringify objects
        }
        return value;
      });
    }
  }

 

  /**
 * Formats a number or string as money in thousands.
 * @param {number|string} input - The number or string to format.
 * @returns {string} - The formatted string in thousands.
 */
export function formatAsMoney(input: number | string) {
  // Ensure input is a number
  const number = Number(input);
  if (isNaN(number)) {
      throw new Error("Invalid input: Please provide a valid number or numeric string.");
  }

  // Format number with commas
  return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
  });
}
  
