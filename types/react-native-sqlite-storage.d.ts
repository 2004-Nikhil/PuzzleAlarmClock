// types/react-native-sqlite-storage.d.ts

// This tells TypeScript that the module 'react-native-sqlite-storage' exists.
declare module 'react-native-sqlite-storage' {
  
  // Define the shape of the result set from a SQL query
  export interface ResultSet {
    insertId: number;
    rowsAffected: number;
    rows: {
      length: number;
      item(index: number): any;
      raw(): any[];
    };
  }
  
  // Define the shape of the database object itself
  export interface SQLiteDatabase {
    executeSql(
      statement: string,
      params?: any[],
    ): Promise<[ResultSet]>;
    
    // You can add other methods like 'transaction', 'close', etc., if you use them
  }

  // Define the function signatures for the module's exports that we use
  export function enablePromise(enabled: boolean): void;

  export function openDatabase(
    options: {
      name: string;
      location: 'default' | 'Library' | 'Documents';
    },
  ): Promise<SQLiteDatabase>;

  // If you need more exports, you can define them here.
}