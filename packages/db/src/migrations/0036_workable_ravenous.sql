CREATE TABLE "chatbot_knowledge_base" (
	"id" uuid PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"answer" text NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"pdf_file_key" text,
	"pdf_file_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
