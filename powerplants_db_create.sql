CREATE TABLE IF NOT EXISTS UNITS (
    "eic_p" varchar(20),
    "eic_g" varchar(20),
    "name_p" text,
    "name_g" text,
    "capacity_p" float,
    "capacity_g" float,
    "type_g" text,
    "lat" float,
    "lon" float,
    "country" varchar(40),
    "NUTS2" text,
    "status_g" text,
    "year_commissioned" int,
    "year_decommissioned" int,
    "water_type" text,
    "cooling_type" text,
    "water_withdrawal" float,
    "water_consumption" float,
    PRIMARY KEY ("eic_p", "eic_g")
);
        
CREATE TABLE IF NOT EXISTS PERFORMANCE (
    "eic_p" varchar(20),
    "eic_g" varchar(20),
    "min_load" float,
    "ramp_up" float,
    "ramp_down" float,
    "minimum_up_time" float,
    "minimum_down_time" float,
    "eff" float,
    "best_source" text,
    PRIMARY KEY ("eic_p", "eic_g")
);
        
CREATE TABLE IF NOT EXISTS TEMPORAL (
    "eic_p" varchar(20),
    "eic_g" varchar(20),
    "type_g" text,
    "cyear" int,
    "generation" float,
    "cf" float,
    "time_coverage" float,
    "co2emitted" float,
    PRIMARY KEY ("eic_p", "eic_g")
);