import { AutomationList } from "./automationList";
import { TopContainer } from "./topContainer";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import axios from "axios";



axios.defaults.withCredentials = true;



export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios.post("http://localhost:5000/dashboard")
    .then(() => {
      setLoading(false);
    })
    .catch(() => {
      navigate("/login");
    });
  }, [navigate]);
  if (loading) return null;
  return (
    <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '80px 1fr',
      gridTemplateAreas: '"topContainer" "listContainer"',
      height: '100vh',
    }}>
    <TopContainer />
    <AutomationList />
    </div>
  );
}