import { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

function App() {
    const [formData, setFormData] = useState({
        timestamp: new Date().toISOString(),
        device_id: 'ajxbs-rpi-01',
        source: 'waterlogger',
        metrics: [{ name: 'ph', value: 7.0, unit: 'pH', quality: 'ok' }],
        tags: '{"location": "lab"}',
        note: ''
    });
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }
    const [recentEvents, setRecentEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Fetch recent events
    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/events?limit=10`);
            if (res.ok) {
                const data = await res.json();
                setRecentEvents(data);
            }
        } catch (err) {
            console.error("Failed to fetch events", err);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleMetricChange = (index, field, val) => {
        const newMetrics = [...formData.metrics];
        newMetrics[index][field] = field === 'value' ? parseFloat(val) : val;
        setFormData({ ...formData, metrics: newMetrics });
    };

    const addMetric = () => {
        setFormData({
            ...formData,
            metrics: [...formData.metrics, { name: '', value: 0, unit: '', quality: 'ok' }]
        });
    };

    const removeMetric = (index) => {
        const newMetrics = formData.metrics.filter((_, i) => i !== index);
        setFormData({ ...formData, metrics: newMetrics });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);

        // Validate Tags JSON
        let tagsObj = null;
        if (formData.tags) {
            try {
                tagsObj = JSON.parse(formData.tags);
            } catch (e) {
                setStatus({ type: 'error', message: 'Invalid JSON in tags' });
                return;
            }
        }

        const payload = {
            timestamp: formData.timestamp,
            device_id: formData.device_id,
            source: formData.source,
            metrics: formData.metrics,
            tags: tagsObj,
            note: formData.note
        };

        try {
            const res = await fetch(`${API_BASE_URL}/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: `Ingested! ID: ${data.id}` });
                fetchEvents();
            } else {
                setStatus({ type: 'error', message: `Error: ${JSON.stringify(data)}` });
            }
        } catch (err) {
            setStatus({ type: 'error', message: `Network error: ${err.message}` });
        }
    };

    return (
        <div className="container">
            <h1>BioSensei Ingest</h1>

            <div className="card">
                <h2>New Telemetry Event</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Timestamp</label>
                        <input
                            type="text"
                            value={formData.timestamp}
                            onChange={e => setFormData({ ...formData, timestamp: e.target.value })}
                        />
                    </div>
                    <div className="form-group row">
                        <div>
                            <label>Device ID</label>
                            <input
                                type="text"
                                value={formData.device_id}
                                onChange={e => setFormData({ ...formData, device_id: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label>Source</label>
                            <input
                                type="text"
                                value={formData.source}
                                onChange={e => setFormData({ ...formData, source: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="metrics-section">
                        <h3>Metrics</h3>
                        {formData.metrics.map((m, i) => (
                            <div key={i} className="metric-row">
                                <input placeholder="Name" value={m.name} onChange={e => handleMetricChange(i, 'name', e.target.value)} required />
                                <input placeholder="Value" type="number" step="any" value={m.value} onChange={e => handleMetricChange(i, 'value', e.target.value)} required />
                                <input placeholder="Unit" value={m.unit} onChange={e => handleMetricChange(i, 'unit', e.target.value)} />
                                <select value={m.quality} onChange={e => handleMetricChange(i, 'quality', e.target.value)}>
                                    <option value="ok">ok</option>
                                    <option value="suspect">suspect</option>
                                    <option value="bad">bad</option>
                                </select>
                                <button type="button" onClick={() => removeMetric(i)} className="btn-danger">X</button>
                            </div>
                        ))}
                        <button type="button" onClick={addMetric} className="btn-secondary">+ Add Metric</button>
                    </div>

                    <div className="form-group">
                        <label>Tags (JSON)</label>
                        <textarea
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label>Note</label>
                        <input
                            type="text"
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn-primary">Submit Event</button>
                </form>
                {status && <div className={`alert ${status.type}`}>{status.message}</div>}
            </div>

            <div className="card">
                <h2>Recent Events</h2>
                <div className="events-list">
                    {recentEvents.map(evt => (
                        <div key={evt.id} className="event-item" onClick={() => setSelectedEvent(evt)}>
                            <strong>{evt.timestamp}</strong> - {evt.device_id} ({evt.source})
                            <br />
                            <small>{evt.payload.metrics.length} metrics. Note: {evt.payload.note}</small>
                        </div>
                    ))}
                </div>
            </div>

            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Event Details</h2>
                            <button className="modal-close" onClick={() => setSelectedEvent(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>ID:</strong> {selectedEvent.id}</p>
                            <p><strong>Timestamp:</strong> {selectedEvent.timestamp}</p>
                            <p><strong>Device ID:</strong> {selectedEvent.device_id}</p>
                            <p><strong>Source:</strong> {selectedEvent.source}</p>

                            <h3>Metrics</h3>
                            <ul>
                                {selectedEvent.payload.metrics.map((m, i) => (
                                    <li key={i}>
                                        <strong>{m.name}:</strong> {m.value} {m.unit}
                                        {m.quality && <span style={{ marginLeft: '10px', fontSize: '0.8em', color: '#666' }}>({m.quality})</span>}
                                    </li>
                                ))}
                            </ul>

                            {selectedEvent.payload.tags && (
                                <>
                                    <h3>Tags</h3>
                                    <pre>{JSON.stringify(selectedEvent.payload.tags, null, 2)}</pre>
                                </>
                            )}

                            {selectedEvent.payload.note && (
                                <>
                                    <h3>Note</h3>
                                    <p>{selectedEvent.payload.note}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
