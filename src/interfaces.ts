import { WhereFilterOp } from "firebase-admin/firestore";

/**
 * Firebase where clause
 */
export type whereClause = {
  key: string;
  operator: WhereFilterOp;
  value: unknown;
};


export interface Message {
    status: "success" | "error",
    message: string,
    data?: object
}