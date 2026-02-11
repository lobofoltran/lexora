export type AIDraftStyle = "Vocabulary" | "Phrasal verbs" | "Tech terms";

export type DensityMode = "comfortable" | "compact";

export interface AIDraftCard {
  id: string;
  front: string;
  back: string;
  createdAt: string;
  style: AIDraftStyle;
}
