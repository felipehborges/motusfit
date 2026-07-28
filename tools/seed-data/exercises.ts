export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'other';

export type CatalogExercise = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
};

export const catalogExercises: CatalogExercise[] = [
  // Peito
  { name: 'Supino Reto (barra)', muscleGroup: 'chest', equipment: 'barra' },
  { name: 'Supino Reto (halteres)', muscleGroup: 'chest', equipment: 'halteres' },
  { name: 'Supino Inclinado (barra)', muscleGroup: 'chest', equipment: 'barra' },
  { name: 'Supino Inclinado (halteres)', muscleGroup: 'chest', equipment: 'halteres' },
  { name: 'Supino Declinado (barra)', muscleGroup: 'chest', equipment: 'barra' },
  { name: 'Crucifixo (halteres)', muscleGroup: 'chest', equipment: 'halteres' },
  { name: 'Crossover', muscleGroup: 'chest', equipment: 'cabo' },
  { name: 'Flexão de Braço', muscleGroup: 'chest', equipment: 'peso corporal' },
  { name: 'Peck Deck', muscleGroup: 'chest', equipment: 'máquina' },
  { name: 'Supino Máquina', muscleGroup: 'chest', equipment: 'máquina' },

  // Costas
  { name: 'Barra Fixa', muscleGroup: 'back', equipment: 'peso corporal' },
  { name: 'Puxada Frontal', muscleGroup: 'back', equipment: 'cabo' },
  { name: 'Puxada Alta (pegada aberta)', muscleGroup: 'back', equipment: 'cabo' },
  { name: 'Remada Curvada (barra)', muscleGroup: 'back', equipment: 'barra' },
  { name: 'Remada Cavalinho', muscleGroup: 'back', equipment: 'barra' },
  { name: 'Remada Unilateral (halteres)', muscleGroup: 'back', equipment: 'halteres' },
  { name: 'Remada Baixa', muscleGroup: 'back', equipment: 'cabo' },
  { name: 'Levantamento Terra', muscleGroup: 'back', equipment: 'barra' },
  { name: 'Pull-over (halteres)', muscleGroup: 'back', equipment: 'halteres' },
  { name: 'Remada Máquina', muscleGroup: 'back', equipment: 'máquina' },

  // Ombros
  { name: 'Desenvolvimento Militar (barra)', muscleGroup: 'shoulders', equipment: 'barra' },
  { name: 'Desenvolvimento Arnold (halteres)', muscleGroup: 'shoulders', equipment: 'halteres' },
  { name: 'Elevação Lateral (halteres)', muscleGroup: 'shoulders', equipment: 'halteres' },
  { name: 'Elevação Frontal (halteres)', muscleGroup: 'shoulders', equipment: 'halteres' },
  { name: 'Elevação Posterior (halteres)', muscleGroup: 'shoulders', equipment: 'halteres' },
  { name: 'Desenvolvimento Máquina', muscleGroup: 'shoulders', equipment: 'máquina' },
  { name: 'Encolhimento (halteres)', muscleGroup: 'shoulders', equipment: 'halteres' },
  { name: 'Face Pull', muscleGroup: 'shoulders', equipment: 'cabo' },

  // Bíceps
  { name: 'Rosca Direta (barra)', muscleGroup: 'biceps', equipment: 'barra' },
  { name: 'Rosca Alternada (halteres)', muscleGroup: 'biceps', equipment: 'halteres' },
  { name: 'Rosca Scott (barra)', muscleGroup: 'biceps', equipment: 'barra' },
  { name: 'Rosca Martelo (halteres)', muscleGroup: 'biceps', equipment: 'halteres' },
  { name: 'Rosca Concentrada (halteres)', muscleGroup: 'biceps', equipment: 'halteres' },
  { name: 'Rosca no Cabo', muscleGroup: 'biceps', equipment: 'cabo' },

  // Tríceps
  { name: 'Tríceps Corda', muscleGroup: 'triceps', equipment: 'cabo' },
  { name: 'Tríceps Testa (barra)', muscleGroup: 'triceps', equipment: 'barra' },
  { name: 'Tríceps Francês (halteres)', muscleGroup: 'triceps', equipment: 'halteres' },
  { name: 'Mergulho no Banco', muscleGroup: 'triceps', equipment: 'peso corporal' },
  { name: 'Tríceps Pulley (barra)', muscleGroup: 'triceps', equipment: 'cabo' },
  { name: 'Supino Fechado', muscleGroup: 'triceps', equipment: 'barra' },

  // Pernas
  { name: 'Agachamento Livre', muscleGroup: 'legs', equipment: 'barra' },
  { name: 'Leg Press', muscleGroup: 'legs', equipment: 'máquina' },
  { name: 'Cadeira Extensora', muscleGroup: 'legs', equipment: 'máquina' },
  { name: 'Mesa Flexora', muscleGroup: 'legs', equipment: 'máquina' },
  { name: 'Cadeira Flexora', muscleGroup: 'legs', equipment: 'máquina' },
  { name: 'Afundo (halteres)', muscleGroup: 'legs', equipment: 'halteres' },
  { name: 'Agachamento Búlgaro (halteres)', muscleGroup: 'legs', equipment: 'halteres' },
  { name: 'Stiff (barra)', muscleGroup: 'legs', equipment: 'barra' },
  { name: 'Panturrilha em Pé', muscleGroup: 'legs', equipment: 'máquina' },
  { name: 'Panturrilha Sentado', muscleGroup: 'legs', equipment: 'máquina' },
  { name: 'Hack Squat', muscleGroup: 'legs', equipment: 'máquina' },

  // Glúteos
  { name: 'Elevação Pélvica (barra)', muscleGroup: 'glutes', equipment: 'barra' },
  { name: 'Cadeira Abdutora', muscleGroup: 'glutes', equipment: 'máquina' },
  { name: 'Glúteo no Cabo', muscleGroup: 'glutes', equipment: 'cabo' },
  { name: 'Coice no Cabo', muscleGroup: 'glutes', equipment: 'cabo' },

  // Core
  { name: 'Abdominal Supra', muscleGroup: 'core', equipment: 'peso corporal' },
  { name: 'Prancha', muscleGroup: 'core', equipment: 'peso corporal' },
  { name: 'Elevação de Pernas', muscleGroup: 'core', equipment: 'peso corporal' },
  { name: 'Abdominal na Máquina', muscleGroup: 'core', equipment: 'máquina' },
  { name: 'Rotação de Tronco no Cabo', muscleGroup: 'core', equipment: 'cabo' },
];
