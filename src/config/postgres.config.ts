import { logger } from "firebase-functions/v2";
import { Message } from "../utility";
import knex, { Knex } from "knex";

/**
 * The `PgDatabase` class provides a wrapper for interacting with a PostgreSQL database using Knex.js.
 * It manages database connections, executes stored procedures, and ensures proper resource cleanup.
 */
export class PgDatabase {
  private db: Knex; // Knex.js instance
  private schema: string; // Database schema

  /**
   * Initializes a new instance of `PgDatabase` for PostgreSQL interactions.
   * @param schema - The schema name where stored procedures reside.
   * @param connectionOptions - The database connection options.
   */
  constructor(schema: string, connectionOptions: Knex.Config) {
    this.db = knex({ client: "pg", connection: connectionOptions });
    this.schema = schema;
  }

  /**
   * Checks if a stored procedure exists in the database.
   * @param methodName - The name of the stored procedure.
   * @returns A boolean indicating whether the procedure exists.
   */
  private async procedureExists(methodName: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = ? AND p.proname = ?
      ) AS exists;
    `;
    try {
      const result = await this.db.raw(query, [this.schema, methodName]);
      return result.rows[0]?.exists || false;
    } catch (error) {
      logger.error(`Error checking procedure existence: ${error}`);
      return false;
    }
  }

  /**
   * Executes a stored procedure in the database.
   * @param methodName - The stored procedure name.
   * @param parameters - Parameters to be passed to the procedure.
   * @returns A promise resolving to the procedure's return value.
   * @throws If the procedure does not exist or execution fails.
   */
  async runStoredMethod(methodName: string, parameters: any[] = []): Promise<Message> {
    const exists = await this.procedureExists(methodName);
    if (!exists) {
      throw new Error(`Stored procedure ${this.schema}.${methodName} does not exist.`);
    }

    const placeholders = parameters.map((_, i) => `$${i + 1}`).join(",");
    const query = `CALL "${this.schema}"."${methodName}"(${placeholders})`;

    try {
      const result = await this.db.raw(query, parameters);
      logger.info("Stored procedure executed successfully:", result);
      return result.rows[0]?.f_return_value;
    } catch (error) {
      logger.log(`query parameter: ${parameters}`);
      logger.error(`Error executing stored method: ${error}`);
      throw new Error("Unable to execute transaction: " + error);
    } finally {
      await this.db.destroy();
    }
  }
}
