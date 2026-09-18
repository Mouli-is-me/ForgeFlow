import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "skill_bridge_twin.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS simulations (
            id TEXT PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            run_type TEXT,
            duration INTEGER,
            throughput REAL,
            production REAL,
            bottleneck TEXT,
            scenario_summary TEXT,
            result_json TEXT
        )
    """)
    conn.commit()
    conn.close()
