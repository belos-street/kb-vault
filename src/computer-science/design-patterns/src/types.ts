export type Priority = 'P0' | 'P1' | 'P2';

export type Category = '创建型' | '结构型' | '行为型' | '现代工程';

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  priority: Priority;
  category: Category;
  docPath: string;
  task: string;
  hints: string[];
  starterCode: string;
}
