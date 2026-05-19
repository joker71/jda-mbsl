import mysql, { Pool, PoolOptions, ResultSetHeader } from "mysql2/promise";

interface StudentRecord {
  id: string;
  name: string;
  helpRequested: boolean;
}

interface HelpRequestRecord {
  studentId: string;
  type: "help-request";
}

interface SClassRegistrationRecord {
  studentId: string;
  type: "sclass-registration";
}

export interface DecisionalDbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export class DecisionalMysqlStore {
  private pool?: Pool;

  constructor(private readonly config: DecisionalDbConfig) {}

  static fromEnv(): DecisionalMysqlStore {
    return new DecisionalMysqlStore({
      host: process.env.MYSQL_HOST ?? "127.0.0.1",
      port: Number(process.env.MYSQL_PORT ?? "3306"),
      user: process.env.MYSQL_USER ?? "root",
      password: process.env.MYSQL_PASSWORD ?? "Hangnga98#",
      database: process.env.MYSQL_DATABASE ?? "domainds"
    });
  }

  async init(): Promise<void> {
    const adminConnection = await mysql.createConnection(this.getAdminConfig());
    try {
      await adminConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${this.config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } finally {
      await adminConnection.end();
    }

    this.pool = mysql.createPool(this.getPoolConfig());
    await this.createTables();
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = undefined;
    }
  }

  async upsertStudent(student: StudentRecord): Promise<void> {
    const pool = this.requirePool();
    await pool.execute(
      `INSERT INTO students (id, name, help_requested)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         help_requested = VALUES(help_requested)`,
      [student.id, student.name, student.helpRequested]
    );
  }

  async createHelpRequest(record: HelpRequestRecord): Promise<number> {
    const pool = this.requirePool();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO help_requests (student_id, type, content)
       VALUES (?, ?, ?)`,
      [record.studentId, record.type, null]
    );
    return result.insertId;
  }

  async createSClassRegistration(record: SClassRegistrationRecord): Promise<number> {
    const pool = this.requirePool();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sclass_registrations (student_id, type, sclass_name)
       VALUES (?, ?, ?)`,
      [record.studentId, record.type, null]
    );
    return result.insertId;
  }

  private requirePool(): Pool {
    if (!this.pool) {
      throw new Error("MySQL pool has not been initialised");
    }
    return this.pool;
  }

  private getAdminConfig(): PoolOptions {
    return {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password
    };
  }

  private getPoolConfig(): PoolOptions {
    return {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }

  private async createTables(): Promise<void> {
    const pool = this.requirePool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        help_requested BOOLEAN NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS help_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(32) NOT NULL,
        type VARCHAR(64) NOT NULL,
        content VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_help_requests_student
          FOREIGN KEY (student_id) REFERENCES students(id)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sclass_registrations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(32) NOT NULL,
        type VARCHAR(64) NOT NULL,
        sclass_name VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_sclass_registrations_student
          FOREIGN KEY (student_id) REFERENCES students(id)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      )
    `);
  }
}
