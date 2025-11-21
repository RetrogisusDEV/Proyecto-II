const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Configuración personalizable
const substitutionConfig = {
  prefix: 'ñ',
  suffix: 'ц',
  // Valores base por defecto (serán sobrescritos si se usa modificador)
  baseValues: {
    lowercaseStart: 1,
    uppercaseStart: 27,
    numbersStart: 53,
    spaceValue: 0,
    escapeChar: '!',
    escapeValue: 33
  }
};

// Función hash simple para generar valores determinísticos
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

// Calcula valores base basados en el modificador
const computeBaseValues = (modifier) => {
  const hash = simpleHash(modifier);
  const possibleEscapeChars = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '+', '='];
  
  return {
    escapeChar: possibleEscapeChars[hash % possibleEscapeChars.length],
    lowercaseStart: (hash % 900) + 100, // 100-999
    uppercaseStart: (hash % 900) + 1000, // 1000-1899
    numbersStart: (hash % 900) + 2000, // 2000-2899
    spaceValue: hash % 100, // 0-99
    escapeValue: (hash % 900) + 3000 // 3000-3899
  };
};

// Generar mapa de sustitución (con o sin modificador)
const generateSubstitutionMap = (modifier) => {
  const baseValues = modifier ? computeBaseValues(modifier) : substitutionConfig.baseValues;
  const { prefix, suffix } = substitutionConfig;
  const esc = baseValues.escapeChar;
  const map = {};
  
  // Caracter de escape
  map[esc] = `${prefix}${baseValues.escapeValue}${suffix}`;
  
  // Letras minúsculas (a-z)
  for (let i = 0; i < 26; i++) {
    const char = String.fromCharCode(97 + i);
    map[char] = `${prefix}${i + baseValues.lowercaseStart}${suffix}`;
  }
  
  // Letras mayúsculas (A-Z)
  for (let i = 0; i < 26; i++) {
    const char = String.fromCharCode(65 + i);
    map[char] = `${prefix}${i + baseValues.uppercaseStart}${suffix}`;
  }
  
  // Números (0-9)
  for (let i = 0; i < 10; i++) {
    const char = String.fromCharCode(48 + i);
    map[char] = `${prefix}${i + baseValues.numbersStart}${suffix}`;
  }
  
  // Espacio
  map[' '] = `${prefix}${baseValues.spaceValue}${suffix}`;
  
  return { map, baseValues };
};

// Codificador con soporte para modificador
const encode = (text, modifier) => {
  const { map: substitutionMap, baseValues } = generateSubstitutionMap(modifier);
  const { prefix } = substitutionConfig;
  const esc = baseValues.escapeChar;
  
  // Escapar prefijos existentes
  const escapedText = text.replace(
    new RegExp(escapeRegExp(prefix), 'g'),
    `${esc}${prefix}`
  );
  
  return Array.from(escapedText)
    .map(char => substitutionMap[char] || char)
    .join('');
};

// Decodificador con soporte para modificador
const decode = (encodedText, modifier) => {
  const { map: substitutionMap } = generateSubstitutionMap(modifier);
  const decodeEntries = Object.entries(substitutionMap)
    .map(([char, code]) => ({ code, char }))
    .sort((a, b) => b.code.length - a.code.length);
  
  return decodeEntries.reduce((result, { code, char }) => {
    const regex = new RegExp(escapeRegExp(code), 'g');
    return result.replace(regex, char);
  }, encodedText);
};

// Hacer las funciones accesibles globalmente en el navegador
if (typeof window !== 'undefined') {
  // Espacio de nombres simple para evitar contaminar mucho `window`
  window.AMEcryptor = window.AMEcryptor || {};
  window.AMEcryptor.encode = encode;
  window.AMEcryptor.decode = decode;
  // 'encore' solicitado por el usuario — alias hacia encode
  window.AMEcryptor.encore = encode;

  // También proporcionar accesos directos por conveniencia
  window.encore = encode;
  window.encodeAME = encode;
  window.decodeAME = decode;
}
