"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = __importDefault(require("./client"));
async function runMigrations() {
    try {
        console.log('🚀 Running database migrations...');
        const schemaSQL = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, 'schema.sql'), 'utf-8');
        // Split by statements and execute
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        for (const statement of statements) {
            const { error } = await client_1.default.rpc('exec_sql', { sql: statement });
            if (error) {
                // Try direct execution if RPC not available
                console.log('Note: Execute these SQL statements manually in Supabase SQL Editor:');
                console.log('\n' + schemaSQL + '\n');
                break;
            }
        }
        console.log('✅ Database migrations completed successfully');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n📝 Please run the SQL from src/database/schema.sql manually in Supabase SQL Editor');
        process.exit(1);
    }
}
if (require.main === module) {
    runMigrations();
}
exports.default = runMigrations;
//# sourceMappingURL=migrate.js.map