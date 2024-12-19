/**
 * Compares two values deeply for equality.
 * @param {*} obj1 The first value to compare.
 * @param {*} obj2 The second value to compare.
 * @returns {boolean} Whether the two values are deeply equal.
 */
export function isEqual(obj1, obj2) {
  // Check for strict equality (handles primitives, null, undefined)
  if (obj1 === obj2) return true;

  // If either is null or not an object, they are not equal
  if (obj1 === null || obj2 === null || typeof obj1 !== "object" || typeof obj2 !== "object") {
    return false;
  }

  // If they have different constructors, they are not equal
  if (obj1.constructor !== obj2.constructor) return false;

  // Handle Arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!isEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  // Handle Objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // If they have a different number of keys, they are not equal
  if (keys1.length !== keys2.length) return false;

  // Check if all keys and their values are equal
  for (let key of keys1) {
    if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Creates a deep copy of the given object or array.
 * @param {*} obj value to clone
 * @returns {*} deep clone of the given value
 */
export function deepClone(obj) {
  // Check for null or undefined
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj);
  }

  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }

  // Handle Object
  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = deepClone(obj[key]);
    }
  }
  return newObj;
}
