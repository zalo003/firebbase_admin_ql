import { logger } from "firebase-functions/v2";
import { Message } from "../utility";

/**
 * The `PgDatabase` class provides a wrapper for interacting with a PostgreSQL database using Knex.js.
 * It is responsible for establishing a connection to the database, running stored procedures, and managing database transactions.
 * It is initialized with a schema and can execute stored procedures with parameters.
 */
export class PgDatabase {
  
  /**
   * The Knex.js instance used for interacting with the PostgreSQL database.
   * @type {any}
   */
  private db: any;

  /**
   * The schema in which the stored procedure resides.
   * @type {string}
   */
  private schema: string = "";

  /**
   * Creates an instance of `PgDatabase` for connecting to a PostgreSQL database.
   * 
   * @param {string} schema - The schema name where stored procedures or functions are located.
   * 
   * @example
   * const pgDatabase = new PgDatabase("myschema");
   */
  constructor(
    schema: string,
    db: any
  ) {
    // Initialize the Knex.js client with PostgreSQL connection options
    this.db = db;
    this.schema = schema;
  }

  /**
   * Executes a stored procedure or function in the database.
   * 
   * @param {string} methodName - The name of the stored procedure or function to be executed.
   * @param {Array<unknown>} parameters - An array of parameters to be passed to the stored procedure or function.
   * @returns {Promise<Message>} A promise that resolves with the result of the stored procedure or function.
   * 
   * @throws {Error} Throws an error if the stored procedure fails to execute.
   * 
   * @example
   * const result = await pgDatabase.runStoredMethod("myProcedure", [param1, param2]);
   */
  async runStoredMethod(
    methodName: string, 
    parameters: Array<any> = [] ): Promise<Message> {
    try {
      // Construct the parameter placeholders for the SQL query
      const placeholders = parameters.map(() => "?").join(",");

      // Construct the SQL query string with the stored procedure name and parameter placeholders
      const query = `CALL ${this.schema}.${methodName}(${placeholders})`;

      // Run the stored procedure using Knex.js raw query method
      const result = await this.db.raw(query, parameters);

      // Log the result of the stored procedure execution
      logger.log("logger log method result:", result);
      
      // Return the first result of the stored procedure's return value
      return result.rows[0]["f_return_value"];
    } catch (error) {
      // Log and throw an error if the execution fails
      logger.log("Error executing stored method:", error);
      throw new Error("Unable to run current transaction: " + error);
    } finally {
      // Close the database connection after executing the query
      this.db.destroy();
    }
  }
}
