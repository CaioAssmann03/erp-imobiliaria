const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Um id lido da URL (`?condominium=`, `?unit=`, `?block=`); só um UUID vale, porque o valor entra num endereço e numa consulta. */
export const uuidParam = (value: string | null) => (value && UUID.test(value) ? value : null);
