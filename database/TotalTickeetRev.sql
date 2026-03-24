-- report_total_ticket_revenue.sql
SELECT SUM(final_price) AS total_ticket_revenue
FROM ticket;