/**
 * People are listed per module (spec 046). Every screen of the app today belongs to the
 * Condominiums module, so it asks for and offers only the people of `condominiums`, and a person
 * created there is released to it in the same request (`?person_module=` on the create); the Rentals
 * screens will pass `rentals`.
 */
export const CONDOMINIUMS_MODULE = "condominiums" as const;
