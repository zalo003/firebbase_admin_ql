import { Firestore } from "firebase-admin/firestore";
import { PgDatabase } from "../config/postgres.config";
import { Message, PgFormData } from "../utility";
import { FirebaseModel } from "./firestore.db";
import { logger } from "firebase-functions/v2";
import { Knex } from "knex";

type PgBackup = {
    backupDb: string, 
    whereKeys?: string | string[], 
    dbLabel: string, 
    firestorReference?: string
}

type DBData = {
    formData: object,
    backups?: PgBackup[]
};

/**
 * The `BaseProcedure` class extends the `PgDatabase` class and provides an abstraction for executing PostgreSQL stored procedures and optionally backing up data to a Firestore database.
 * It handles calling the stored procedure, processing the results, and saving the data to Firestore if necessary.
 */
export class PgBaseModel extends PgDatabase {
  
    /**
     * The name of the stored procedure to be executed.
     * @type {string}
     */
    private procedure: string;

    /**
     * The order of the parameters for the stored procedure.
     * @type {string[]}
     */
    private order: string[];

    private firestoreDB: Firestore;

    /**
     * Creates an instance of the `BaseProcedure` class.
     * 
     * @param {string} schema - The schema in which the stored procedure resides.
     * @param {string} procedure - The name of the stored procedure to be executed.
     * @param {string[]} order - The order of the parameters to be passed to the stored procedure.
     */
    constructor(schema: string, procedure: string, order: string[], dbInstance: Knex, firestoreDB: Firestore) {
        super(schema, dbInstance);
        this.procedure = procedure;
        this.order = order;
        this.firestoreDB = firestoreDB;
    }

    /**
     * Executes the stored procedure with the provided form data and optionally backs up the data to Firestore.
     * 
     * @param {object} dbData
     * @returns {Promise<Message>} A promise that resolves with the result of the stored procedure or an error message.
     */
    async call(dbData: DBData): Promise<Message> {
        try {
            const { formData, backups } = dbData;
            // Create an instance of PgFormData to format the form data in the correct order
            const pgForm = new PgFormData(formData, this.order);

            // Run the stored procedure with the formatted values
            const returnValue = await this.runStoredMethod(
                this.procedure,
                pgForm.values
            );

            // If the stored procedure was successful and backup parameters are provided, back up data to Firestore
            if (returnValue.status === 'success' && backups) {
                await Promise.all(backups.map((pgBackup)=>{
                    const {backupDb, whereKeys, dbLabel, firestorReference} = pgBackup;
                    return this.saveToFirestore(
                        backupDb,
                        dbLabel,
                        returnValue.data as Object,
                        whereKeys,
                        firestorReference
                    );
                }));
            }

            // Return the result of the procedure execution
            return returnValue;
        } catch (error) {
            // Log and handle errors
            logger.error('pg call error: ', error);
            logger.error('db data: ', dbData);
            return {
                status: 'error',
                message: 'Unable to complete process'
            };
        }
    }

    // save item to firestore
    private async saveToFirestore(backupDb: string, dbLabel: string, data: object, key?: string | string[],   firestorReference?: string){
        const fireDb = new FirebaseModel(backupDb, this.firestoreDB);
        const reference = await fireDb.doBackup({
            whereKey: key,
            returnData: data,
            dbLabel,
            reference: firestorReference
        });
        // Include the reference in the returned data
        // returnValue.data = { reference, ...returnValue.data };
    }
}
