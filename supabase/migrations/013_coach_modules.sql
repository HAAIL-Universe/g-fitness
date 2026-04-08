ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS coach_type_preset text
    CHECK (
      coach_type_preset IN (
        'personal_trainer',
        'nutritionist',
        'wellness_coach',
        'sports_performance_coach',
        'yoga_pilates_instructor',
        'gym_studio_owner'
      )
    ),
  ADD COLUMN IF NOT EXISTS active_modules text[];
