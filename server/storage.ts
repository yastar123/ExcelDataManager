import { users, type User, type InsertUser, records, type Record, type InsertRecord } from "@shared/schema";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Record CRUD operations
  getAllRecords(): Promise<Record[]>;
  getRecordById(id: number): Promise<Record | undefined>;
  getRecordByStandardId(standardId: string): Promise<Record | undefined>;
  createRecord(record: InsertRecord): Promise<Record>;
  createManyRecords(records: InsertRecord[]): Promise<Record[]>;
  getRecordsByDateRange(startDate?: string, endDate?: string): Promise<Record[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private recordsData: Map<number, Record>;
  currentUserId: number;
  currentRecordId: number;

  constructor() {
    this.users = new Map();
    this.recordsData = new Map();
    this.currentUserId = 1;
    this.currentRecordId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Record CRUD operations
  async getAllRecords(): Promise<Record[]> {
    return Array.from(this.recordsData.values());
  }

  async getRecordById(id: number): Promise<Record | undefined> {
    return this.recordsData.get(id);
  }

  async getRecordByStandardId(standardId: string): Promise<Record | undefined> {
    return Array.from(this.recordsData.values()).find(
      (record) => record.standardid === standardId,
    );
  }

  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    const id = this.currentRecordId++;
    const now = new Date();
    const record: Record = { 
      ...insertRecord, 
      id,
      created_at: now,
      updated_at: now
    };
    this.recordsData.set(id, record);
    return record;
  }

  async createManyRecords(insertRecords: InsertRecord[]): Promise<Record[]> {
    const createdRecords: Record[] = [];
    
    for (const insertRecord of insertRecords) {
      const record = await this.createRecord(insertRecord);
      createdRecords.push(record);
    }
    
    return createdRecords;
  }

  async getRecordsByDateRange(startDate?: string, endDate?: string): Promise<Record[]> {
    let records = Array.from(this.recordsData.values());
    
    if (startDate) {
      const start = new Date(startDate);
      records = records.filter(record => new Date(record.tanggal) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      records = records.filter(record => new Date(record.tanggal) <= end);
    }
    
    return records;
  }
}

export const storage = new MemStorage();
