// src/database/database.ts

import { enablePromise, openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';

// Enable promise-based API
enablePromise(true);
export interface StandardChallengeConfig {} // An empty object for now
export interface StepsChallengeConfig {
  count: number;
}
export type ChallengeConfig = StandardChallengeConfig | StepsChallengeConfig;

export interface Alarm {
  id?: number;
  time: string; // "HH:MM"
  label: string;
  repeatDays: number[]; // [0, 1, 2, 3, 4, 5, 6]
  isEnabled: boolean;
  challengeType: 'STANDARD' | 'STEPS'; // This now acts as a "discriminator"
  challengeConfig: ChallengeConfig; // Use the new union type
  wakeUpCheck: boolean;
}

const DATABASE_NAME = 'PuzzleAlarm.db';

// --- DATABASE CONNECTION ---
export const getDBConnection = async () => {
  return openDatabase({ name: DATABASE_NAME, location: 'default' });
};

// --- TABLE CREATION ---
export const createTables = async (db: SQLiteDatabase) => {
  const query = `
    CREATE TABLE IF NOT EXISTS Alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      label TEXT,
      repeatDays TEXT NOT NULL,
      isEnabled BOOLEAN NOT NULL,
      challengeType TEXT NOT NULL,
      challengeConfig TEXT NOT NULL,
      wakeUpCheck BOOLEAN NOT NULL
    );
  `;
  await db.executeSql(query);
};

// --- CRUD OPERATIONS ---

export const getAlarms = async (db: SQLiteDatabase): Promise<Alarm[]> => {
  try {
    const alarms: Alarm[] = [];
    const results = await db.executeSql('SELECT * FROM Alarms');
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        alarms.push({
          ...row,
          isEnabled: !!row.isEnabled, // Convert 0/1 to boolean
          wakeUpCheck: !!row.wakeUpCheck,
          repeatDays: JSON.parse(row.repeatDays),
          challengeConfig: JSON.parse(row.challengeConfig),
        });
      }
    });
    return alarms;
  } catch (error) {
    console.error('Error fetching alarms:', error);
    throw error;
  }
};

export const getAlarmById = async (db: SQLiteDatabase, id: number): Promise<Alarm | undefined> => {
  try {
    const results = await db.executeSql('SELECT * FROM Alarms WHERE id = ?', [id]);
    if (results[0].rows.length > 0) {
      const row = results[0].rows.item(0);
      return {
        ...row,
        isEnabled: !!row.isEnabled,
        wakeUpCheck: !!row.wakeUpCheck,
        repeatDays: JSON.parse(row.repeatDays),
        challengeConfig: JSON.parse(row.challengeConfig),
      };
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching alarm with id ${id}:`, error);
    throw error;
  }
};


export const saveAlarm = async (db: SQLiteDatabase, alarm: Omit<Alarm, 'id'>): Promise<number> => {
  const insertQuery = `
    INSERT INTO Alarms (time, label, repeatDays, isEnabled, challengeType, challengeConfig, wakeUpCheck)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  const values = [
    alarm.time,
    alarm.label,
    JSON.stringify(alarm.repeatDays),
    alarm.isEnabled,
    alarm.challengeType,
    JSON.stringify(alarm.challengeConfig),
    alarm.wakeUpCheck,
  ];
  const results = await db.executeSql(insertQuery, values);
  return results[0].insertId;
};

export const updateAlarm = async (db: SQLiteDatabase, alarm: Alarm) => {
    if (!alarm.id) throw new Error("Alarm ID is required for update.");
    const updateQuery = `
      UPDATE Alarms
      SET time = ?, label = ?, repeatDays = ?, isEnabled = ?, challengeType = ?, challengeConfig = ?, wakeUpCheck = ?
      WHERE id = ?;
    `;
    const values = [
        alarm.time,
        alarm.label,
        JSON.stringify(alarm.repeatDays),
        alarm.isEnabled,
        alarm.challengeType,
        JSON.stringify(alarm.challengeConfig),
        alarm.wakeUpCheck,
        alarm.id,
    ];
    return db.executeSql(updateQuery, values);
};


export const deleteAlarm = async (db: SQLiteDatabase, id: number) => {
  const deleteQuery = `DELETE FROM Alarms WHERE id = ?`;
  await db.executeSql(deleteQuery, [id]);
};