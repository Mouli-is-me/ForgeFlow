import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.connection import init_db

init_db()
client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_line_status():
    response = client.get("/api/line/status")
    assert response.status_code == 200
    data = response.json()
    assert len(data["machines"]) == 5
    assert data["machines"][0]["id"] == "M1"
    assert data["buffer_capacity"] == 100.0

def test_run_baseline_simulation():
    response = client.post("/api/simulation/run", json={"duration_minutes": 1440, "events": []})
    assert response.status_code == 200
    data = response.json()
    assert data["bottleneck"]["machine"] == "M3"
    assert "time_series" in data
    assert len(data["time_series"]) == 1440 # Should have exactly 1440 items

def test_m3_capacity_reduction():
    response = client.post("/api/simulation/run", json={
        "duration_minutes": 1440,
        "events": [
            {"tick": 61, "type": "capacity_change", "machine_id": "M3", "value": 0.8}
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["bottleneck"]["machine"] == "M3"
    assert data["throughput"] < 60.0 # Throughput reduced

def test_m3_30_min_downtime():
    response = client.post("/api/simulation/run", json={
        "duration_minutes": 1440,
        "events": [
            {"tick": 300, "type": "downtime", "machine_id": "M3", "duration": 30}
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["downtime_impact"]["M3"] == 30.0

def test_what_if_comparison():
    response = client.post("/api/simulation/what-if", json={
        "duration_minutes": 1440,
        "scenario_name": "Test M3 Upgrade",
        "events": [
            {"tick": 61, "type": "capacity_change", "machine_id": "M3", "value": 1.6667}
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["baseline_bottleneck"] == "M3"
    # Depending on buffer capacity, the new bottleneck is M2 or M4
    assert data["scenario_bottleneck"] != "M3"
    assert data["throughput_delta"] > 0
    assert data["production_loss"] == 0
    assert data["production_delta"] > 0

def test_history_save_and_retrieval():
    # Fetch history
    response = client.get("/api/history")
    assert response.status_code == 200
    history = response.json()
    assert len(history) > 0 # Since previous tests saved runs
    
    # Fetch specific
    sim_id = history[0]["id"]
    response2 = client.get(f"/api/history/{sim_id}")
    assert response2.status_code == 200
    data = response2.json()
    assert data["id"] == sim_id
    assert "result_json" in data

def test_invalid_input_handling():
    # Negative duration
    response = client.post("/api/simulation/run", json={"duration_minutes": -10, "events": []})
    assert response.status_code == 422 # Pydantic validation error or FastAPI exception
    
    # Invalid event type
    response2 = client.post("/api/simulation/run", json={
        "duration_minutes": 1440,
        "events": [{"tick": 1, "type": "magic_event", "machine_id": "M1"}]
    })
    assert response2.status_code == 422
