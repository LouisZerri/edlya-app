/**
 * Objet fichier compatible avec le FormData de React Native.
 * React Native attend { uri, name, type } mais le typage DOM refuse ce format,
 * d'où le cast nécessaire encapsulé ici une seule fois.
 */
interface RNFileBlob {
  uri: string;
  name: string;
  type: string;
}

/**
 * Ajoute un fichier (photo, PDF…) à un FormData en mode React Native.
 * Élimine le `as any` dispersé dans tout le code.
 */
export function appendFile(formData: FormData, field: string, file: RNFileBlob): void {
  formData.append(field, file as unknown as Blob);
}
