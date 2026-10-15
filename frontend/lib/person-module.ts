/**
 * People are listed per module (spec 019). Every screen of the app today belongs to the
 * Condominiums module, so it asks for and offers only the people of `condominiums`; the Rentals
 * screens will pass `rentals`.
 */
export const CONDOMINIUMS_MODULE = "condominiums" as const;
