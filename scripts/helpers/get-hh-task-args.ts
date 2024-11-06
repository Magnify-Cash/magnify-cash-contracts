export function getParamByKey<T extends object>(obj: T, key: string): T[keyof T] {
    if (key in obj) return obj[key as keyof T];
    else throw new Error("Error: an unknown parameter");
}
