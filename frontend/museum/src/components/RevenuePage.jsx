import { useEffect, useState } from "react";
import { getTotalDonations, getTotalTickets } from "../services/api";

export default function RevenuePage() {
  const [donations, setDonations] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const donationsData = await getTotalDonations();
        const ticketsData = await getTotalTickets();
        setDonations(donationsData.total);
        setTickets(ticketsData.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRevenue();
  }, []);

  if (loading) return <p>Loading revenue data...</p>;

  return (
    <div>
      <h2>Revenue Overview</h2>
      <p>Total Donations: ${donations}</p>
      <p>Total Ticket Sales: ${tickets}</p>
      <p>Total Museum Revenue: ${donations + tickets}</p>
    </div>
  );
}