WITH catalog AS (
  SELECT *
  FROM jsonb_to_recordset($catalog$
  [
    {"name":"Supino Reto (barra)","muscle_group":"chest","equipment":"barra"},
    {"name":"Supino Reto (halteres)","muscle_group":"chest","equipment":"halteres"},
    {"name":"Supino Inclinado (barra)","muscle_group":"chest","equipment":"barra"},
    {"name":"Supino Inclinado (halteres)","muscle_group":"chest","equipment":"halteres"},
    {"name":"Supino Declinado (barra)","muscle_group":"chest","equipment":"barra"},
    {"name":"Crucifixo (halteres)","muscle_group":"chest","equipment":"halteres"},
    {"name":"Crossover","muscle_group":"chest","equipment":"cabo"},
    {"name":"Flexão de Braço","muscle_group":"chest","equipment":"peso corporal"},
    {"name":"Peck Deck","muscle_group":"chest","equipment":"máquina"},
    {"name":"Supino Máquina","muscle_group":"chest","equipment":"máquina"},
    {"name":"Barra Fixa","muscle_group":"back","equipment":"peso corporal"},
    {"name":"Puxada Frontal","muscle_group":"back","equipment":"cabo"},
    {"name":"Puxada Alta (pegada aberta)","muscle_group":"back","equipment":"cabo"},
    {"name":"Remada Curvada (barra)","muscle_group":"back","equipment":"barra"},
    {"name":"Remada Cavalinho","muscle_group":"back","equipment":"barra"},
    {"name":"Remada Unilateral (halteres)","muscle_group":"back","equipment":"halteres"},
    {"name":"Remada Baixa","muscle_group":"back","equipment":"cabo"},
    {"name":"Levantamento Terra","muscle_group":"back","equipment":"barra"},
    {"name":"Pull-over (halteres)","muscle_group":"back","equipment":"halteres"},
    {"name":"Remada Máquina","muscle_group":"back","equipment":"máquina"},
    {"name":"Desenvolvimento Militar (barra)","muscle_group":"shoulders","equipment":"barra"},
    {"name":"Desenvolvimento Arnold (halteres)","muscle_group":"shoulders","equipment":"halteres"},
    {"name":"Elevação Lateral (halteres)","muscle_group":"shoulders","equipment":"halteres"},
    {"name":"Elevação Frontal (halteres)","muscle_group":"shoulders","equipment":"halteres"},
    {"name":"Elevação Posterior (halteres)","muscle_group":"shoulders","equipment":"halteres"},
    {"name":"Desenvolvimento Máquina","muscle_group":"shoulders","equipment":"máquina"},
    {"name":"Encolhimento (halteres)","muscle_group":"shoulders","equipment":"halteres"},
    {"name":"Face Pull","muscle_group":"shoulders","equipment":"cabo"},
    {"name":"Rosca Direta (barra)","muscle_group":"biceps","equipment":"barra"},
    {"name":"Rosca Alternada (halteres)","muscle_group":"biceps","equipment":"halteres"},
    {"name":"Rosca Scott (barra)","muscle_group":"biceps","equipment":"barra"},
    {"name":"Rosca Martelo (halteres)","muscle_group":"biceps","equipment":"halteres"},
    {"name":"Rosca Concentrada (halteres)","muscle_group":"biceps","equipment":"halteres"},
    {"name":"Rosca no Cabo","muscle_group":"biceps","equipment":"cabo"},
    {"name":"Tríceps Corda","muscle_group":"triceps","equipment":"cabo"},
    {"name":"Tríceps Testa (barra)","muscle_group":"triceps","equipment":"barra"},
    {"name":"Tríceps Francês (halteres)","muscle_group":"triceps","equipment":"halteres"},
    {"name":"Mergulho no Banco","muscle_group":"triceps","equipment":"peso corporal"},
    {"name":"Tríceps Pulley (barra)","muscle_group":"triceps","equipment":"cabo"},
    {"name":"Supino Fechado","muscle_group":"triceps","equipment":"barra"},
    {"name":"Agachamento Livre","muscle_group":"legs","equipment":"barra"},
    {"name":"Leg Press","muscle_group":"legs","equipment":"máquina"},
    {"name":"Cadeira Extensora","muscle_group":"legs","equipment":"máquina"},
    {"name":"Mesa Flexora","muscle_group":"legs","equipment":"máquina"},
    {"name":"Cadeira Flexora","muscle_group":"legs","equipment":"máquina"},
    {"name":"Afundo (halteres)","muscle_group":"legs","equipment":"halteres"},
    {"name":"Agachamento Búlgaro (halteres)","muscle_group":"legs","equipment":"halteres"},
    {"name":"Stiff (barra)","muscle_group":"legs","equipment":"barra"},
    {"name":"Panturrilha em Pé","muscle_group":"legs","equipment":"máquina"},
    {"name":"Panturrilha Sentado","muscle_group":"legs","equipment":"máquina"},
    {"name":"Hack Squat","muscle_group":"legs","equipment":"máquina"},
    {"name":"Elevação Pélvica (barra)","muscle_group":"glutes","equipment":"barra"},
    {"name":"Cadeira Abdutora","muscle_group":"glutes","equipment":"máquina"},
    {"name":"Glúteo no Cabo","muscle_group":"glutes","equipment":"cabo"},
    {"name":"Coice no Cabo","muscle_group":"glutes","equipment":"cabo"},
    {"name":"Abdominal Supra","muscle_group":"core","equipment":"peso corporal"},
    {"name":"Prancha","muscle_group":"core","equipment":"peso corporal"},
    {"name":"Elevação de Pernas","muscle_group":"core","equipment":"peso corporal"},
    {"name":"Abdominal na Máquina","muscle_group":"core","equipment":"máquina"},
    {"name":"Rotação de Tronco no Cabo","muscle_group":"core","equipment":"cabo"}
  ]
  $catalog$::jsonb) AS item(name text, muscle_group text, equipment text)
)
INSERT INTO "exercises" ("owner_id", "source", "name", "muscle_group", "equipment")
SELECT NULL, 'catalog', catalog.name, catalog.muscle_group, catalog.equipment
FROM catalog
WHERE NOT EXISTS (
  SELECT 1
  FROM "exercises" existing
  WHERE existing."source" = 'catalog' AND existing."name" = catalog.name
);
