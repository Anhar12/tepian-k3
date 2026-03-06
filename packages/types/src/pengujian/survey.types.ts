import {
  surveyQuestions,
  surveyResponses,
  surveyFeedback,
} from "@tepian-k3/db/schema";

export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = typeof surveyQuestions.$inferInsert;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

export type SurveyFeedback = typeof surveyFeedback.$inferSelect;
export type InsertSurveyFeedback = typeof surveyFeedback.$inferInsert;
