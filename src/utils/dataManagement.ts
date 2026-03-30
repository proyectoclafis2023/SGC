/**
 * Master keys used in local storage
 */
export const MASTER_KEYS = [
    'personnel_data',
    'residents_data',
    'owners_data',
    'articles_data',
    'infrastructure_data',
    'banks_data',
    'pension_funds_data',
    'health_providers_data',
    'contractors_data',
    'unit_types_data',
    'parking_data',
    'emergency_numbers_data',
    'tickets_data',
    'certificates_data',
    'payslips_data',
    'advances_data',
    'visitor_data',
    'package_data',
    'logbook_data',
    'shifts_data',
    'reservations_data',
    'reservation_logs_data',
    'correspondence_data',
    'article_deliveries_data',
    'camera_requests_data',
    'common_spaces_data',
    'equipment_items_data',
    'fixed_assets_data',
    'contractor_visits_data',
    'system_messages_data',
    'visitor_history_data'
];

/**
 * Resets the application state by clearing local storage.
 * @param keepConfig If true, preserves system settings and auth
 */
export const resetSystemData = (keepConfig: boolean = true) => {
    if (keepConfig) {
        // Only clear master data, keep settings and user
        MASTER_KEYS.forEach(key => localStorage.removeItem(key));
    } else {
        // Full clear
        localStorage.clear();
    }

    // Reload the application to apply changes
    window.location.href = '/';
};
