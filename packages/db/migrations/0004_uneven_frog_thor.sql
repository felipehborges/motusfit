CREATE TABLE "session_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"target_sets" integer,
	"target_reps_min" integer,
	"target_reps_max" integer,
	"rest_seconds" integer DEFAULT 90 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "session_exercises" (
	"session_id",
	"exercise_id",
	"position",
	"target_sets",
	"target_reps_min",
	"target_reps_max",
	"rest_seconds"
)
SELECT
	ws."id",
	re."exercise_id",
	re."position",
	re."target_sets",
	re."target_reps_min",
	re."target_reps_max",
	re."rest_seconds"
FROM "workout_sessions" ws
INNER JOIN "routine_exercises" re ON re."routine_id" = ws."routine_id";
--> statement-breakpoint
WITH missing AS (
	SELECT DISTINCT ws."session_id", ws."exercise_id"
	FROM "workout_sets" ws
	WHERE NOT EXISTS (
		SELECT 1
		FROM "session_exercises" se
		WHERE se."session_id" = ws."session_id" AND se."exercise_id" = ws."exercise_id"
	)
), positioned AS (
	SELECT
		missing."session_id",
		missing."exercise_id",
		COALESCE((
			SELECT MAX(se."position")
			FROM "session_exercises" se
			WHERE se."session_id" = missing."session_id"
		), -1) + ROW_NUMBER() OVER (
			PARTITION BY missing."session_id"
			ORDER BY missing."exercise_id"
		) AS "position"
	FROM missing
)
INSERT INTO "session_exercises" ("session_id", "exercise_id", "position", "rest_seconds")
SELECT "session_id", "exercise_id", "position", 90
FROM positioned;
--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "session_exercises_session_exercise_uq" ON "session_exercises" USING btree ("session_id","exercise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_exercises_session_position_uq" ON "session_exercises" USING btree ("session_id","position");
