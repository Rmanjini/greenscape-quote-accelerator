-- Representative Greenscape Pro pricing catalog (Phoenix premium pricing).
-- The real spreadsheet has 200+ line items; this is a demo-sized slice that
-- covers their services. NOTE: there is intentionally NO "outdoor kitchen" SKU,
-- so a quote that mentions one trips the needs-review guardrail instead of
-- inventing a price. Run after schema.sql.

insert into pricing_items (sku, name, description, category, unit, unit_price) values
  ('ART-TURF-001',        'Artificial Turf Installation',      'Premium pet-grade turf, installed', 'turf',       'sqft',      12.50),
  ('TURF-PREP-001',       'Turf Base Prep & Grading',          'Excavation, base, compaction',      'prep',       'sqft',       3.50),
  ('SOD-001',             'Natural Sod Installation',          'Hybrid bermuda sod',                'turf',       'sqft',       2.75),
  ('PAVER-001',           'Premium Paver Patio Installation',  'Belgard/equivalent pavers',         'hardscape',  'sqft',      18.00),
  ('PAVER-TRAVERTINE-001','Travertine Paver Installation',     'Silver travertine, French pattern', 'hardscape',  'sqft',      24.00),
  ('PAVER-DRIVEWAY-001',  'Paver Driveway',                    'Driveway-grade paver system',       'hardscape',  'sqft',      22.00),
  ('CONCRETE-001',        'Stamped Concrete',                  'Colored & stamped concrete',        'hardscape',  'sqft',      14.00),
  ('DEMO-001',            'Demolition & Haul-away',            'Remove existing surface, haul off', 'prep',       'sqft',       4.50),
  ('PERGOLA-001',         '12x14 Cedar Pergola',               'Cedar pergola, stained',            'structure',  'each',    9500.00),
  ('PERGOLA-ALU-001',     '12x14 Aluminum Louvered Pergola',   'Motorized louvered roof',           'structure',  'each',   16500.00),
  ('FIREPIT-001',         'Gas Fire Pit (36in Standard)',      'Standard 36in gas fire pit',        'feature',    'each',    4200.00),
  ('FIREPIT-CUSTOM-001',  'Custom Masonry Fire Pit',           'Built-in stone/block fire pit',     'feature',    'each',    7800.00),
  ('OUTDOOR-FIREPLACE-001','Outdoor Fireplace',                'Full masonry outdoor fireplace',    'feature',    'each',   12500.00),
  ('WATER-001',           'Water Feature — Basalt Columns',    'Bubbling basalt column set',        'feature',    'each',    6500.00),
  ('RETWALL-001',         'Retaining Wall (Block)',            'Segmental block wall, per face sf', 'wall',       'sqft',      32.00),
  ('IRRIGATION-001',      'Irrigation System Install',         'Drip + spray zones',                'irrigation', 'linear_ft',  6.50),
  ('IRRIGATION-INSPECT-001','Irrigation Inspection',           'Test & report existing system',     'irrigation', 'lump_sum', 350.00),
  ('DRAINAGE-001',        'French Drain',                      'Perforated pipe + gravel',          'drainage',   'linear_ft', 42.00),
  ('LIGHTING-001',        'Landscape Lighting (per fixture)',  'Low-voltage LED fixture, installed','lighting',   'each',     285.00),
  ('PLANTING-001',        'Desert Planting Package',           'Designer desert plant package',     'planting',   'lump_sum',2500.00)
on conflict (sku) do nothing;
