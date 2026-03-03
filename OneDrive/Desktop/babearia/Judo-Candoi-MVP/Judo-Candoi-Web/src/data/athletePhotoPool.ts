export type AthleteMediaCategory = "Treinos" | "Campeonatos" | "Podio";

export interface AthleteMediaItem {
  id: string;
  imageUrl: string;
  title: string;
  athleteName: string;
  categoryHint?: AthleteMediaCategory | "auto";
}

export const athleteMediaPool: AthleteMediaItem[] = [
  { id: 'athlete-001', imageUrl: '/images/athletes/athlete-001.jpeg', title: 'Registro de atleta 001', athleteName: 'Atleta 01', categoryHint: 'auto' },
  { id: 'athlete-002', imageUrl: '/images/athletes/athlete-002.jpeg', title: 'Registro de atleta 002', athleteName: 'Atleta 02', categoryHint: 'auto' },
  { id: 'athlete-003', imageUrl: '/images/athletes/athlete-003.jpeg', title: 'Registro de atleta 003', athleteName: 'Atleta 03', categoryHint: 'auto' },
  { id: 'athlete-004', imageUrl: '/images/athletes/athlete-004.jpeg', title: 'Registro de atleta 004', athleteName: 'Atleta 04', categoryHint: 'auto' },
  { id: 'athlete-005', imageUrl: '/images/athletes/athlete-005.jpeg', title: 'Registro de atleta 005', athleteName: 'Atleta 05', categoryHint: 'auto' },
  { id: 'athlete-006', imageUrl: '/images/athletes/athlete-006.jpeg', title: 'Registro de atleta 006', athleteName: 'Atleta 06', categoryHint: 'auto' },
  { id: 'athlete-007', imageUrl: '/images/athletes/athlete-007.jpeg', title: 'Registro de atleta 007', athleteName: 'Atleta 07', categoryHint: 'auto' },
  { id: 'athlete-008', imageUrl: '/images/athletes/athlete-008.jpeg', title: 'Registro de atleta 008', athleteName: 'Atleta 08', categoryHint: 'auto' },
  { id: 'athlete-009', imageUrl: '/images/athletes/athlete-009.jpeg', title: 'Registro de atleta 009', athleteName: 'Atleta 09', categoryHint: 'auto' },
  { id: 'athlete-010', imageUrl: '/images/athletes/athlete-010.jpeg', title: 'Registro de atleta 010', athleteName: 'Atleta 10', categoryHint: 'auto' },
  { id: 'athlete-011', imageUrl: '/images/athletes/athlete-011.jpeg', title: 'Registro de atleta 011', athleteName: 'Atleta 11', categoryHint: 'auto' },
  { id: 'athlete-012', imageUrl: '/images/athletes/athlete-012.jpeg', title: 'Registro de atleta 012', athleteName: 'Atleta 12', categoryHint: 'auto' },
  { id: 'athlete-013', imageUrl: '/images/athletes/athlete-013.jpeg', title: 'Registro de atleta 013', athleteName: 'Atleta 01', categoryHint: 'auto' },
  { id: 'athlete-014', imageUrl: '/images/athletes/athlete-014.jpeg', title: 'Registro de atleta 014', athleteName: 'Atleta 02', categoryHint: 'auto' },
  { id: 'athlete-015', imageUrl: '/images/athletes/athlete-015.jpeg', title: 'Registro de atleta 015', athleteName: 'Atleta 03', categoryHint: 'auto' },
  { id: 'athlete-016', imageUrl: '/images/athletes/athlete-016.jpeg', title: 'Registro de atleta 016', athleteName: 'Atleta 04', categoryHint: 'auto' },
  { id: 'athlete-017', imageUrl: '/images/athletes/athlete-017.jpeg', title: 'Registro de atleta 017', athleteName: 'Atleta 05', categoryHint: 'auto' },
  { id: 'athlete-018', imageUrl: '/images/athletes/athlete-018.jpeg', title: 'Registro de atleta 018', athleteName: 'Atleta 06', categoryHint: 'auto' },
  { id: 'athlete-019', imageUrl: '/images/athletes/athlete-019.jpeg', title: 'Registro de atleta 019', athleteName: 'Atleta 07', categoryHint: 'auto' },
  { id: 'athlete-020', imageUrl: '/images/athletes/athlete-020.jpeg', title: 'Registro de atleta 020', athleteName: 'Atleta 08', categoryHint: 'auto' },
  { id: 'athlete-021', imageUrl: '/images/athletes/athlete-021.jpeg', title: 'Registro de atleta 021', athleteName: 'Atleta 09', categoryHint: 'auto' },
  { id: 'athlete-022', imageUrl: '/images/athletes/athlete-022.jpeg', title: 'Registro de atleta 022', athleteName: 'Atleta 10', categoryHint: 'auto' },
  { id: 'athlete-023', imageUrl: '/images/athletes/athlete-023.jpeg', title: 'Registro de atleta 023', athleteName: 'Atleta 11', categoryHint: 'auto' },
  { id: 'athlete-024', imageUrl: '/images/athletes/athlete-024.jpeg', title: 'Registro de atleta 024', athleteName: 'Atleta 12', categoryHint: 'auto' },
  { id: 'athlete-025', imageUrl: '/images/athletes/athlete-025.jpeg', title: 'Registro de atleta 025', athleteName: 'Atleta 01', categoryHint: 'auto' },
  { id: 'athlete-026', imageUrl: '/images/athletes/athlete-026.jpeg', title: 'Registro de atleta 026', athleteName: 'Atleta 02', categoryHint: 'auto' },
  { id: 'athlete-027', imageUrl: '/images/athletes/athlete-027.jpeg', title: 'Registro de atleta 027', athleteName: 'Atleta 03', categoryHint: 'auto' },
  { id: 'athlete-028', imageUrl: '/images/athletes/athlete-028.jpeg', title: 'Registro de atleta 028', athleteName: 'Atleta 04', categoryHint: 'auto' },
  { id: 'athlete-029', imageUrl: '/images/athletes/athlete-029.jpeg', title: 'Registro de atleta 029', athleteName: 'Atleta 05', categoryHint: 'auto' },
  { id: 'athlete-030', imageUrl: '/images/athletes/athlete-030.jpeg', title: 'Registro de atleta 030', athleteName: 'Atleta 06', categoryHint: 'auto' },
  { id: 'athlete-031', imageUrl: '/images/athletes/athlete-031.jpeg', title: 'Registro de atleta 031', athleteName: 'Atleta 07', categoryHint: 'auto' },
  { id: 'athlete-032', imageUrl: '/images/athletes/athlete-032.jpeg', title: 'Registro de atleta 032', athleteName: 'Atleta 08', categoryHint: 'auto' },
  { id: 'athlete-033', imageUrl: '/images/athletes/athlete-033.jpeg', title: 'Registro de atleta 033', athleteName: 'Atleta 09', categoryHint: 'auto' },
  { id: 'athlete-034', imageUrl: '/images/athletes/athlete-034.jpeg', title: 'Registro de atleta 034', athleteName: 'Atleta 10', categoryHint: 'auto' },
];
