export interface GameDto {
  bggId: number;
  title: string;
  description: string | null;
  minPlayers: number;
  maxPlayers: number;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  weight: number;
  thumbnail: string | null;
  categories: string[];
}

export interface GameSearchResultDto {
  bggId: number;
  title: string;
  yearPublished: number | null;
  thumbnail: string | null;
}
