-- Trigger: Upgrade Member Level Based on Donations
DELIMITER $$

CREATE TRIGGER upgrade_membership
AFTER INSERT ON donation
FOR EACH ROW
BEGIN
    -- Check total donations for this user
    IF (SELECT SUM(amount) 
        FROM donation 
        WHERE user_id = NEW.user_id) >= 1000 THEN

        -- Upgrade membership level to Gold if total donations >= 1000
        UPDATE member
        SET membership_level = 'Gold'
        WHERE user_id = NEW.user_id;
    END IF;
END$$

DELIMITER ;