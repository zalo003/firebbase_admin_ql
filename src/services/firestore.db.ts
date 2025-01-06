import { CollectionReference, DocumentData, FieldValue, Firestore, QuerySnapshot } from "firebase-admin/firestore";
import { whereClause } from "../interfaces";
import { logger } from "firebase-functions/v2";

/**
 * Represents a Firebase model for interacting with Firestore collections.
 */
export class FirebaseModel {
    db: Firestore;
    collection: CollectionReference<DocumentData> | any;
  
    /**
     * Initializes the FirebaseModel class with the Firestore database instance and the document collection name.
     * @param {string} table - The name of the Firestore collection to interact with.
     * @param {Firestore} firestoreDB - The Firestore database instance.
     */
    constructor(table: string, firestoreDB: Firestore) {
      this.db = firestoreDB;
      this.collection = firestoreDB.collection(table);
    }
  
    /**
     * Fetches a single document from the Firestore collection by its ID.
     * @param {string} id - The document ID to fetch.
     * @returns {Promise<DocumentData | boolean>} Resolves to the document data if found, or `false` if the document doesn't exist.
     */
    async find(id: string): Promise<DocumentData | boolean> {
      try {
        const document = await this.collection.doc(id).get();
        if (document.exists) {
          return document.data() as DocumentData;
        } else {
          return false;
        }
      } catch (error) {
        // unable to find data
        logger.log("find: ", error);
        return false;
      }
    }
  
    /**
     * Checks if a document exists in the Firestore collection by its ID.
     * @param {string} id - The document ID to check.
     * @returns {Promise<boolean>} Resolves to `true` if the document exists, or `false` otherwise.
     */
    async dataExists(id: string): Promise<boolean> {
      try {
        return (await this.collection.doc(id).get()).exists;
      } catch (error) {
        logger.log("data exists: ", error);
        return false;
      }
    }
  
    /**
     * Updates an existing document with the given data in the Firestore collection.
     * @param {object} data - A key-value pair representing the data to update.
     * @param {string} id - The document ID to update.
     * @returns {Promise<boolean>} Resolves to `true` if the update was successful, or `false` if an error occurred.
     */
    async update(data: object, id: string): Promise<boolean> {
      try {
        await this.collection.doc(id).update(data);
        return true;
      } catch (error) {
        logger.log("update: ", error);
        return false;
      }
    }
  
    /**
     * Fetches multiple documents from the Firestore collection. If `ids` are provided, it fetches only those documents. Otherwise, it fetches all documents in the collection.
     * @param {string[]} [ids] - An optional array of document IDs to fetch. If not provided, fetches all documents.
     * @returns {Promise<DocumentData[]>} Resolves to an array of documents' data.
     */
    async findAll(ids?: string[]): Promise<DocumentData[]> {
      try {
        if (ids) {
          const results: DocumentData[] = [];
          for (const id of ids) {
            const item = await this.find(id);
            if (item) {
              results.push(item as DocumentData);
            }
          }
          return results;
        } else {
          return (await this.collection.get()).docs;
        }
      } catch (error) {
        logger.log("findAll: ", error);
        return [];
      }
    }
  
    /**
     * Performs a complex query to find documents that match the given conditions (where clauses).
     * @param {object} clause - The where clauses to filter documents.
     * @param {whereClause[]} clause.wh - An array of `whereClause` objects, each containing a field name (`key`), operator (`operator`), and value (`value`) for filtering documents.
     * @returns {Promise<DocumentData[]>} Resolves to an array of documents that match the query.
     */
    async findWhere({ wh }: { wh: whereClause[] }): Promise<DocumentData[]> {
      try {
        // Start with the collection reference
        let query = this.collection;
    
        // Apply each where clause to the query
        for (const clause of wh) {
          query = query.where(clause.key, clause.operator, clause.value);
        }
    
        // Execute the query
        const snapshot = await query.get() as QuerySnapshot;
    
        if (!snapshot.empty) {
          return snapshot.docs.map((document) => {
            return { ...document.data(), reference: document.id };
          });
        } else {
          return [];
        }
      } catch (error) {
        throw new Error(`findWhere: ${error}`);
      }
    }
    
  
    /**
     * Creates a new document or updates an existing document with the provided data in the Firestore collection.
     * @param {object} data - A key-value pair representing the data to save.
     * @param {string | undefined} id - An optional document ID. If not provided, a new document is created. If provided, the document is updated with the given ID.
     * @returns {Promise<string | boolean>} Resolves to the document ID of the created or updated document if successful, or `false` if an error occurred.
     */
    async save(data: object, id?: string | undefined): Promise<string | boolean> {
      delete (data as any).reference;
      try {
        if (id === undefined) {
          const documentRef = await this.collection.add(data);
          return documentRef.id;
        } else {
          await this.collection.doc(id).set(data);
          return id;
        }
      } catch (error) {
        logger.log("save: ", error);
        return false;
      }
    }
  
    /**
     * Deletes a document from the Firestore collection by its ID.
     * @param {string} id - The document ID to delete.
     * @returns {Promise<boolean>} Resolves to `true` if the deletion was successful, or `false` if an error occurred.
     */
    async delete(id: string): Promise<boolean> {
      try {
        await this.collection.doc(id).delete();
        return true;
      } catch (error) {
        logger.log("delete: ", error);
        return false;
      }
    }
  
    /**
     * Atomically adds items to an array field in a document. If the document does not exist, it creates a new document with the array.
     * @param {any[]} data - The array of items to add to the document's array field.
     * @param {string | undefined} id - The optional document ID. If not provided, a new document is created.
     * @returns {Promise<boolean>} Resolves to `true` if the operation was successful, or `false` if an error occurred.
     */
    async addToArray(data: any[], id?: string): Promise<boolean> {
      try {
        if (id) {
          const dataExist = await this.dataExists(id);
          if (dataExist) {
            await this.collection.doc(id).update({
              data: FieldValue.arrayUnion(...data),
            });
          } else {
            await this.collection.doc(id).set({ data });
          }
        } else {
          await this.collection.add({ data });
        }
        return true;
      } catch (error) {
        return false;
      }
    }
  
    /**
     * Performs a backup of the provided data to Firestore. It checks if the data already exists based on the specified `whereKey` and saves or updates the document accordingly.
     * @param {object} params - The backup parameters.
     * @param {string | string[]} params.whereKey - The key or keys to use for querying existing data.
     * @param {object} params.returnData - The data to be backed up.
     * @param {string} params.dbLabel - The label used to find the data in the provided `returnData`.
     * @returns {Promise<boolean | string>} Resolves to `true` if the backup was successful, or `false` if an error occurred. If the data already exists, the document reference is returned.
     */
    async doBackup({
      whereKey,
      returnData,
      dbLabel,
      reference
    }: {
      whereKey?: string | string[],
      returnData: object,
      dbLabel: string,
      reference?: string
    }): Promise<boolean | string> {
      try {
        let ref = undefined;
        if(reference){
          ref = reference;
        } else if(whereKey) {
          const where: whereClause[] = [];
          if (typeof whereKey === "string") {
            where.push({
              key: whereKey,
              operator: "==",
              value: (returnData as any)[dbLabel][whereKey],
            });
          } else {
            whereKey.forEach((key) => {
              where.push({
                key,
                operator: "==",
                value: (returnData as any)[dbLabel][key],
              });
            });
          }
          const itemExist = await this.findWhere({ wh: where });
          if(itemExist.length > 0){
            ref = itemExist[0].reference
          }
        }
  
        // Backup return value to Firestore
        return await this.save((returnData as any)[dbLabel],  ref);
      } catch (error) {
        logger.log("firestore backup error: ", error);
        return false;
      }
    }
  }
  