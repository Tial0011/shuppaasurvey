export type QuestionType = 'single' | 'multi' | 'text' | 'longtext' | 'rating' | 'yesno';
/** 'unimed' marks the question that tells us if someone is a UNIMED student (first option = UNIMED).
 *  'heard' marks the "how did you hear about us?" question. */
export type QuestionTag = 'none' | 'unimed' | 'heard';

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  help?: string;
  required: boolean;
  options?: string[];
  allowOther?: boolean;
  tag?: QuestionTag;
  ratingLow?: string;
  ratingHigh?: string;
}

export interface Settings {
  isOpen: boolean;
  responseTarget: number;
  earlyAccessLimit: number;
  surveyTitle: string;
  surveyIntro: string;
  /** yyyy-mm-dd, day 1 of the 14-day push */
  campaignStart: string;
}

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

export interface Contact {
  name: string;
  phone: string;
  email: string;
}

export interface SurveyResponse {
  id: string;
  answers: Answers;
  contact: Contact | null;
  source: string;
  isUnimed: boolean | null;
  heardFrom: string | null;
  durationSec: number;
  createdAt: Date;
}

export type EventType = 'visit' | 'start';
