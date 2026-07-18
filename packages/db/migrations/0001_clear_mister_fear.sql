CREATE TABLE "diary_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"meal_slot" text NOT NULL,
	"food_id" uuid NOT NULL,
	"quantity" numeric(8, 2) NOT NULL,
	"client_id" uuid,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_favorites" (
	"user_id" text NOT NULL,
	"food_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_favorites_user_id_food_id_pk" PRIMARY KEY("user_id","food_id")
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text,
	"source" text DEFAULT 'user' NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"serving_size" numeric(8, 2) NOT NULL,
	"serving_unit" text NOT NULL,
	"kcal" numeric(8, 1) NOT NULL,
	"protein_g" numeric(8, 2) NOT NULL,
	"carbs_g" numeric(8, 2) NOT NULL,
	"fat_g" numeric(8, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kcal" numeric(8, 1) NOT NULL,
	"protein_g" numeric(8, 2) NOT NULL,
	"carbs_g" numeric(8, 2) NOT NULL,
	"fat_g" numeric(8, 2) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_favorites" ADD CONSTRAINT "food_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_favorites" ADD CONSTRAINT "food_favorites_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diary_entries_user_date_ix" ON "diary_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "diary_entries_client_id_uq" ON "diary_entries" USING btree ("user_id","client_id");--> statement-breakpoint
CREATE INDEX "foods_owner_name_ix" ON "foods" USING btree ("owner_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "nutrition_goals_current_uq" ON "nutrition_goals" USING btree ("user_id") WHERE "nutrition_goals"."effective_to" IS NULL;