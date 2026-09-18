import json
import uuid
from backend.database.connection import get_db_connection
from backend.models.domain import SimulationResult, ComparisonResult

def save_simulation(run_type: str, duration: int, result, scenario_summary: str = "") -> str:
    sim_id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Handle both baseline and comparison results
    if isinstance(result, SimulationResult):
        throughput = result.throughput
        production = result.production
        bottleneck = result.bottleneck.machine
    else:
        throughput = result.scenario_throughput
        production = result.scenario_production
        bottleneck = result.scenario_bottleneck
        
    result_json = result.model_dump_json()
    
    cursor.execute("""
        INSERT INTO simulations (id, run_type, duration, throughput, production, bottleneck, scenario_summary, result_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (sim_id, run_type, duration, throughput, production, bottleneck, scenario_summary, result_json))
    
    conn.commit()
    conn.close()
    return sim_id

def get_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, timestamp, run_type, duration, throughput, production, bottleneck, scenario_summary 
        FROM simulations ORDER BY timestamp DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_simulation_by_id(sim_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM simulations WHERE id = ?", (sim_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        data = dict(row)
        data['result_json'] = json.loads(data['result_json'])
        return data
    return None
