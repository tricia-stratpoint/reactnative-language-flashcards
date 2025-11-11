import { saveSecureItem, deleteSecureItem } from "@/app/utils/secureStore";
import auth from "@react-native-firebase/auth";

export const loginUser = async (email: string, password: string) => {
  const userCredential = await auth().signInWithEmailAndPassword(
    email,
    password
  );
  const token = await userCredential.user.getIdToken();
  await saveSecureItem("userToken", token);
};

export const logoutUser = async () => {
  await auth().signOut();
  await deleteSecureItem("userToken");
};
