import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">

      <div className="dash-grid">
        <div className="dash-card">
          <h2>Upcoming Events</h2>
          <p>No events yet</p>
        </div>

        <div className="dash-card">
          <h2>Messages</h2>
          <p>No new messages</p>
        </div>

        <div className="dash-card">
          <h2>Team Activity</h2>
          <p>Nothing to show yet</p>
        </div>

        <div className="dash-card">
          <h2>Performance</h2>
          <p>Stats coming soon</p>
        </div>
      </div>
    </div>
  );
}
