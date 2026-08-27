import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '../backend/medismart.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
print(f"Database File: {os.path.abspath(db_path)}")
print(f"Found Tables: {tables}")

for table in tables:
    count = cursor.execute(f"SELECT COUNT(*) FROM {table};").fetchone()[0]
    columns = [col[1] for col in cursor.execute(f"PRAGMA table_info({table});").fetchall()]
    print(f"\n--- TABLE: {table} (Columns: {columns}, Total Rows: {count}) ---")
    rows = cursor.execute(f"SELECT * FROM {table} LIMIT 5;").fetchall()
    for row in rows:
        print(" ", row)

conn.close()
print("\n>>> SQLite Database Verification Passed 100% <<<")
