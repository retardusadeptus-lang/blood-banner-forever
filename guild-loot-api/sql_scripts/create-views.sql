PRAGMA foreign_keys = ON;

CREATE VIEW IF NOT EXISTS items_bis_view AS
SELECT s.class,
       s.spec,
       i.wowhead_id,
       i.name,
       i.drop_chance,
       i."source",
       i.source_type,
       ib.preraid_bis,
       ib.preraid_opt,
       ib.t4_bis,
       ib.t4_opt,
       ib.t5_bis,
       ib.t5_opt,
       ib.t6_bis,
       ib.t6_opt,
       ib.za_bis,
       ib.za_opt,
       ib.swp_bis,
       ib.swp_opt
FROM   items_bis ib
       JOIN items i
         ON ib.item_id = i.id
       JOIN specs s
         ON ib.spec_id = s.id;
