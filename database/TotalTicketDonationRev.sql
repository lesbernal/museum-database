-- report_total_museum_revenue.sql
SELECT 
    COALESCE(SUM(d.amount), 0) AS donation_revenue,
    COALESCE(SUM(t.final_price), 0) AS ticket_revenue,
    COALESCE(SUM(d.amount), 0) + COALESCE(SUM(t.final_price), 0) AS total_revenue
FROM donation d
LEFT JOIN ticket t ON 1=1;