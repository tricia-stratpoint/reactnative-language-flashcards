import * as SecureStore from "expo-secure-store";

export async function saveSecureItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error("Error saving to SecureStore:", error);
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error("Error reading from SecureStore:", error);
    return null;
  }
}

export async function deleteSecureItem(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error("Error deleting from SecureStore:", error);
  }
}
