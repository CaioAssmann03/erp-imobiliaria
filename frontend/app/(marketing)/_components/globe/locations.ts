export interface GlobeLocation {
  name: string;
  /** Estado, na legenda do cartão. */
  region: string;
  /** Graus: latitude norte positiva, longitude leste positiva. */
  lat: number;
  lon: number;
  /** Posição em `PHOTOS` (foto ilustrativa). */
  photo: number;
}

/** Pontos do mapa (ilustrativos): capitais e cidades de todas as regiões do Brasil, para mostrar uma operação espalhada. */
export const LOCATIONS: GlobeLocation[] = [
  { name: "São Paulo", region: "SP", lat: -23.55, lon: -46.63, photo: 0 },
  { name: "Rio de Janeiro", region: "RJ", lat: -22.91, lon: -43.17, photo: 2 },
  { name: "Belo Horizonte", region: "MG", lat: -19.92, lon: -43.94, photo: 4 },
  { name: "Brasília", region: "DF", lat: -15.79, lon: -47.88, photo: 1 },
  { name: "Salvador", region: "BA", lat: -12.97, lon: -38.51, photo: 3 },
  { name: "Recife", region: "PE", lat: -8.05, lon: -34.88, photo: 5 },
  { name: "Fortaleza", region: "CE", lat: -3.73, lon: -38.52, photo: 6 },
  { name: "Manaus", region: "AM", lat: -3.12, lon: -60.02, photo: 2 },
  { name: "Curitiba", region: "PR", lat: -25.43, lon: -49.27, photo: 1 },
  { name: "Porto Alegre", region: "RS", lat: -30.03, lon: -51.23, photo: 3 },
  { name: "Belém", region: "PA", lat: -1.46, lon: -48.5, photo: 5 },
  { name: "Goiânia", region: "GO", lat: -16.68, lon: -49.25, photo: 4 },
  { name: "Florianópolis", region: "SC", lat: -27.6, lon: -48.55, photo: 6 },
  { name: "Vitória", region: "ES", lat: -20.32, lon: -40.34, photo: 0 },
  { name: "Natal", region: "RN", lat: -5.79, lon: -35.21, photo: 2 },
  { name: "Cuiabá", region: "MT", lat: -15.6, lon: -56.1, photo: 5 },
  { name: "Campo Grande", region: "MS", lat: -20.47, lon: -54.62, photo: 1 },
  { name: "Porto Velho", region: "RO", lat: -8.76, lon: -63.9, photo: 3 },
  { name: "São Luís", region: "MA", lat: -2.53, lon: -44.3, photo: 4 },
  { name: "Teresina", region: "PI", lat: -5.09, lon: -42.8, photo: 6 },
];
