-- report_total_event_attendance.sql
SELECT 
    SUM(total_attendees) AS total_event_attendance
FROM event;