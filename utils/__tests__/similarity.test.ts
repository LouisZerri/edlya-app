import { findBestMatch } from '../similarity';
import { mockLogements } from '../../__fixtures__/logement';

describe('findBestMatch', () => {
  it('retourne null si liste logements vide', () => {
    const result = findBestMatch({ adresse: '12 rue de la Paix' }, []);
    expect(result).toBeNull();
  });

  it('match exact adresse+ville+CP retourne score eleve et bon logement', () => {
    const result = findBestMatch(
      { adresse: '12 rue de la Paix', ville: 'Paris', code_postal: '75001' },
      mockLogements,
    );
    expect(result).not.toBeNull();
    expect(result!.logement.id).toBe('/api/logements/1');
    expect(result!.score).toBeGreaterThan(0.9);
  });

  it('retourne null si aucune correspondance (score < 0.5)', () => {
    const result = findBestMatch(
      { adresse: 'route inconnue', ville: 'Marseille', code_postal: '13000' },
      mockLogements,
    );
    expect(result).toBeNull();
  });

  it('ponderation: adresse identique oriente le choix plus que ville identique', () => {
    // Deux logements: meme ville mais adresses differentes
    const logements = [
      { ...mockLogements[0], adresse: '12 rue de la Paix', ville: 'Paris', codePostal: '75001' },
      { ...mockLogements[1], adresse: '99 boulevard Haussmann', ville: 'Paris', codePostal: '75008' },
    ];

    // Recherche avec adresse proche du logement 1 et meme ville
    const result = findBestMatch(
      { adresse: '12 rue de la Paix', ville: 'Paris', code_postal: '75001' },
      logements,
    );

    // L'adresse (poids 3) doit orienter vers le bon logement malgre meme ville
    expect(result).not.toBeNull();
    expect(result!.logement.id).toBe(logements[0].id);
  });

  it('gere le cas ou seul le CP est renseigne', () => {
    const result = findBestMatch(
      { code_postal: '69007' },
      mockLogements,
    );
    // Seul CP, score = 1/1 = 1.0 (CP match exact) => devrait trouver logement Lyon
    expect(result).not.toBeNull();
    expect(result!.logement.id).toBe('/api/logements/3');
  });

  it('match partiel: meme ville, adresse similaire, trouve le bon logement', () => {
    const result = findBestMatch(
      { adresse: 'boulevard de Belleville', ville: 'Paris', code_postal: '75020' },
      mockLogements,
    );
    expect(result).not.toBeNull();
    // Doit trouver le Studio Belleville (logement 2)
    expect(result!.logement.id).toBe('/api/logements/2');
  });
});
